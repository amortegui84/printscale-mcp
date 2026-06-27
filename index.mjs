#!/usr/bin/env node
// PrintScale MCP server — exposes the PrintScale API as tools for AI agents.
// Auth: set PRINTSCALE_API_KEY (create one at https://printscale.app/dashboard/api).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const BASE = process.env.PRINTSCALE_BASE_URL || "https://printscale.app";
const KEY = process.env.PRINTSCALE_API_KEY;

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (t) => ({ content: [{ type: "text", text: t }] });

async function api(path, { method = "GET", body } = {}) {
  if (!KEY) throw new Error("PRINTSCALE_API_KEY is not set.");
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function uploadLocalFile(filePath) {
  const ct = CONTENT_TYPES[extname(filePath).toLowerCase()] || "image/jpeg";
  const { upload_url, image_url } = await api("/api/v1/uploads", {
    method: "POST",
    body: { filename: basename(filePath), contentType: ct },
  });
  const bytes = await readFile(filePath);
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "content-type": ct },
    body: bytes,
  });
  if (!put.ok) throw new Error(`Upload failed: HTTP ${put.status}`);
  return image_url;
}

const server = new McpServer({ name: "printscale", version: "1.0.0" });

server.tool(
  "printscale_upscale",
  "Upscale an image to a print-ready file. Returns TIFF, PNG and JPG download URLs. " +
    "Provide either a public https image_url OR a local file_path. Charges credits " +
    "from the PrintScale account. The source should already be sharp — this enlarges " +
    "detail, it does not repair blurry images.",
  {
    image_url: z.string().url().optional().describe("Public https URL of the image"),
    file_path: z.string().optional().describe("Path to a local image file (jpg/png/webp)"),
    mode: z
      .enum(["auto", "2x", "3x", "print"])
      .default("auto")
      .describe("auto = 3x for small / 2x for large; 2x or 3x = fixed; print = exact size"),
    cm: z.number().optional().describe("For mode 'print': long side in centimeters"),
    dpi: z
      .union([z.literal(150), z.literal(300), z.literal(600)])
      .optional()
      .describe("For mode 'print': DPI (default 300)"),
  },
  async ({ image_url, file_path, mode, cm, dpi }) => {
    try {
      let url = image_url;
      if (!url && file_path) url = await uploadLocalFile(file_path);
      if (!url) return text("Provide image_url or file_path.");

      const target =
        mode === "print"
          ? { mode: "print", cm: cm ?? 60, dpi: dpi ?? 300 }
          : { mode: "factor", factor: mode === "auto" ? "auto" : Number(mode[0]) };

      const job = await api("/api/v1/upscale", { method: "POST", body: { image_url: url, target } });

      let j;
      for (let i = 0; i < 60; i++) {
        await sleep(5000);
        j = await api(`/api/v1/jobs/${job.id}`);
        if (["done", "failed", "expired"].includes(j.status)) break;
      }
      if (!j || j.status !== "done") {
        return text(`Job ${j?.status ?? "timed out"}${j?.error ? ": " + j.error : ""}`);
      }
      const o = j.outputs || {};
      return text(
        `Upscaled ✓  ${j.width}×${j.height}px · ${job.credits_charged} credit(s)\n` +
          `TIFF: ${o.tiff}\nPNG: ${o.png}\nJPG: ${o.jpg}`
      );
    } catch (err) {
      return text(`Error: ${err.message}`);
    }
  }
);

server.tool(
  "printscale_job",
  "Check the status of a PrintScale upscale job by its id.",
  { job_id: z.string().describe("The job id returned by printscale_upscale") },
  async ({ job_id }) => {
    try {
      const j = await api(`/api/v1/jobs/${job_id}`);
      return text(JSON.stringify(j, null, 2));
    } catch (err) {
      return text(`Error: ${err.message}`);
    }
  }
);

server.tool(
  "printscale_credits",
  "Get the PrintScale credit balance for the configured API key.",
  {},
  async () => {
    try {
      const c = await api("/api/v1/credits");
      return text(`Credits remaining: ${c.balance}`);
    } catch (err) {
      return text(`Error: ${err.message}`);
    }
  }
);

await server.connect(new StdioServerTransport());
