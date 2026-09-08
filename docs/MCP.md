# feedbacks.dev MCP Setup

This guide shows how to connect AI agents to feedbacks.dev through the versioned MCP server package hosted by feedbacks.dev.

The MCP server talks to the hosted REST API with a project API key. It does not need direct Supabase access.

## Requirements

- Node.js 20 or newer
- A feedbacks.dev project API key
- API access enabled for the account plan

Project API keys are for trusted backends, CLIs, and agent configuration. Do not put them in public browser code. The browser widget uses the separate browser-safe project key in the generated install snippet.

Hosted API URL:

```text
https://app.feedbacks.dev
```

Private/internal deployments can replace that URL with their own dashboard, API, widget, and public-board origin.

## Available Tools

- `submit_feedback` - submit a bug, idea, praise, or question
- `submit_test_feedback` - submit a small verification item to the project inbox
- `list_projects` - list the project attached to this API key
- `get_project_setup_packet` - fetch exact install snippets, endpoints, and verification steps
- `verify_widget_install` - inspect a reachable page for the widget and report inbox status
- `list_feedback` - list recent feedback with optional filters
- `search_feedback` - search feedback by keyword
- `update_feedback_status` - update status, priority, or tags
- `get_project_stats` - read project-level feedback statistics

## Quick Smoke Test

From a terminal:

```bash
npm exec --yes --package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz -- feedbacks-mcp --api-key fb_live_your_key
```

For private/internal deployments:

```bash
npm exec --yes --package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz -- feedbacks-mcp --api-key fb_live_your_key --api-url https://your-app-domain.com
```

The process is an MCP stdio server, so it waits for a client instead of printing a web page. If the key is missing, it exits with a clear error.

## Claude Code

Claude Code supports project-scoped `.mcp.json` files and environment variable expansion. Official reference: [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp).

Recommended project config:

```json
{
  "mcpServers": {
    "feedbacks": {
      "type": "stdio",
      "command": "npm",
      "args": ["exec", "--yes", "--package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz", "--", "feedbacks-mcp"],
      "env": {
        "FEEDBACKS_API_KEY": "${FEEDBACKS_API_KEY}",
        "FEEDBACKS_API_URL": "${FEEDBACKS_API_URL:-https://app.feedbacks.dev}"
      }
    }
  }
}
```

Then start Claude Code from the project directory and run:

```text
/mcp
```

If you prefer CLI setup:

```bash
claude mcp add --transport stdio feedbacks --env FEEDBACKS_API_KEY=fb_live_your_key -- npm exec --yes --package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz -- feedbacks-mcp
```

## Cursor

Cursor supports MCP servers through its MCP settings and `mcp.json` configuration. Official reference: [Cursor MCP docs](https://cursor.com/docs/mcp).

Use this server entry:

```json
{
  "mcpServers": {
    "feedbacks": {
      "type": "stdio",
      "command": "npm",
      "args": ["exec", "--yes", "--package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz", "--", "feedbacks-mcp"],
      "env": {
        "FEEDBACKS_API_KEY": "${env:FEEDBACKS_API_KEY}",
        "FEEDBACKS_API_URL": "https://app.feedbacks.dev"
      }
    }
  }
}
```

After saving, refresh MCP tools in Cursor and confirm the feedbacks.dev tools are listed.

## Generic MCP Clients

Any stdio-compatible MCP client can use:

```json
{
  "command": "npm",
  "args": ["exec", "--yes", "--package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz", "--", "feedbacks-mcp"],
  "env": {
    "FEEDBACKS_API_KEY": "fb_live_your_key",
    "FEEDBACKS_API_URL": "https://app.feedbacks.dev"
  }
}
```

For local package testing before publish:

```json
{
  "command": "node",
  "args": ["C:/coding/feedbacks.dev/packages/mcp-server/dist/index.js"],
  "env": {
    "FEEDBACKS_API_KEY": "fb_live_your_key",
    "FEEDBACKS_API_URL": "http://127.0.0.1:3000"
  }
}
```

## Good Agent Prompts

```text
Use get_project_setup_packet, install the recommended Website snippet, then tell me how to verify the widget.
```

```text
Submit a bug to feedbacks.dev: export fails on CSV files larger than 20 MB.
```

```text
Search feedback for billing issues and summarize the top recurring theme.
```

```text
Mark this feedback as reviewed and tag it with billing and onboarding.
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server exits immediately | Set `FEEDBACKS_API_KEY` or pass `--api-key`. |
| Client shows no tools | Rebuild or refresh the MCP server in the client. |
| API requests fail with 401 | Rotate the project API key and update the MCP config. |
| API requests fail with 403 | Confirm the account plan allows MCP/API access. |
| Self-hosted requests hit the hosted app | Set `FEEDBACKS_API_URL` to your own app origin. |
