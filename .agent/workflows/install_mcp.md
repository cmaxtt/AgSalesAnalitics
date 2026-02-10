---
description: Installs or Reinstalls the MCP Server (MSSQL), required for the app to function properly.
---

This workflow helps you install the required Model Context Protocol (MCP) server for MSSQL. The app requires this server to be running for core features.

1.  Check if the MCP server is already installed.
    - Run the check script.
// turbo
2.  Run the setup script which will download and install the MCP server if it is missing.
    - Command: `npm run setup:mcp`
    - This script will:
        - Create `c:\AI-MCP` directory if missing.
        - Clone the `mssql_mcp_server` repository to `c:\AI-MCP\mssql_mcp_server`.
        - Install dependencies (`npm install`).
        - Verify setup.

3.  Configure the environment variables for the MCP server.
    - Navigate to the MCP server directory: `cd c:\AI-MCP\mssql_mcp_server`
    - Create a `.env` file if it doesn't exist, using `.env.example` as a template.
    - Ensure your MSSQL connection details are set correctly in `.env`.

4.  Test the MCP server installation.
    - Run `npm run dev:mcp` from the root of the main project to start it separately and verify it runs without errors.

> **Note**: This setup is critical for the Dashboard app to function correctly. If the MCP server is not running, certain AI features may be unavailable.
