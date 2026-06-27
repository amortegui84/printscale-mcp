# Getting printscale-mcp discovered

The package is on npm (`printscale-mcp`). To maximize discovery, do these (most
are free, one-time):

## 1. GitHub repo (foundation for everything else)
Create `github.com/amortegui84/printscale-mcp` and push this folder. Needed
because: npm links to it, the MCP registry verifies via it, and directories pull
its README. (Claude can do this with a GitHub token, or create it in the UI.)

## 2. Official MCP Registry (registry.modelcontextprotocol.io)
Uses `server.json` (already in this repo, name `io.github.amortegui84/printscale-mcp`).
```bash
# install the publisher CLI
brew install mcp-publisher   # or download from the registry repo releases
mcp-publisher login github   # verifies the io.github.amortegui84/* namespace
mcp-publisher validate       # checks server.json
mcp-publisher publish        # publishes to the registry
```
Most MCP clients/directories sync from this registry.

## 3. awesome-mcp-servers (high-traffic GitHub list)
Open a PR to https://github.com/punkpeye/awesome-mcp-servers adding, under an
"Art & Culture" / "Media" style section:

```md
- [printscale-mcp](https://github.com/amortegui84/printscale-mcp) 📇 ☁️ - Upscale images to print-ready files (TIFF/PNG/JPG) via PrintScale.
```

## 4. Directories (submit or they auto-index from npm/GitHub)
- **Glama** — https://glama.ai/mcp/servers (auto-indexes GitHub; add the repo)
- **mcp.so** — https://mcp.so (submit form)
- **PulseMCP** — https://www.pulsemcp.com (submit form)
- **Smithery** — https://smithery.ai (connect GitHub repo)
- **mcpservers.org / mcp-get** — community lists / PR

## 5. Reach
- A short post (X/LinkedIn) + a line in the PrintScale `/docs` page (already there).
- The npm keywords (`mcp`, `model-context-protocol`, `claude`, `cursor`) help search.

> Note: schemas for the registry/directories evolve — run `mcp-publisher validate`
> and check each directory's current submission format before submitting.
