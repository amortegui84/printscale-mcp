# printscale-mcp

An [MCP](https://modelcontextprotocol.io) server that lets AI agents (Claude
Desktop, Cursor, Claude Code, etc.) upscale images to **print-ready** files
(TIFF + PNG + JPG) via [PrintScale](https://printscale.app).

## Setup

1. Create an API key at **https://printscale.app/dashboard/api**.
2. Add the server to your MCP client config, with the key as an env var.

### Claude Desktop / Cursor (`mcp` config)

```json
{
  "mcpServers": {
    "printscale": {
      "command": "npx",
      "args": ["-y", "printscale-mcp"],
      "env": { "PRINTSCALE_API_KEY": "psk_live_xxxxxxxx" }
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add printscale -e PRINTSCALE_API_KEY=psk_live_xxx -- npx -y printscale-mcp
```

> Running locally from source instead of npm? Use
> `"command": "node", "args": ["/path/to/printscale-mcp/index.mjs"]`.

## Tools

- **`printscale_upscale`** — upscale an image. Provide a public `image_url` **or**
  a local `file_path`. Choose `mode` (`auto` / `2x` / `3x` / `print`); for
  `print`, set `cm` and `dpi`. Returns TIFF/PNG/JPG download URLs. Charges credits.
- **`printscale_job`** — check a job's status by id.
- **`printscale_credits`** — show the remaining credit balance.

## Example prompts

- "Upscale `./product.jpg` to 60 cm at 300 DPI for print."
- "Upscale https://example.com/photo.png at 3x and give me the TIFF."
- "How many PrintScale credits do I have left?"

## Notes

- Start from a sharp source — PrintScale enlarges detail, it doesn't repair
  blurry or low-quality images.
- Outputs are available for 3 days, then deleted. Download within the window.
- Credits are shared with your PrintScale account (buy them in the app).

Env: `PRINTSCALE_API_KEY` (required), `PRINTSCALE_BASE_URL` (optional, defaults to
`https://printscale.app`).
