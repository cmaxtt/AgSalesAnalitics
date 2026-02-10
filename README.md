# AgSalesAnalitics

A modern, interactive Sales Analytics web application designed to connect to SQL Server, analyze sales data, and provide AI-powered executive summaries.

## Features

- **Interactive UI**: Built with React and Vite for a fast, responsive user experience.
- **SQL Server Integration**: Connects to local or remote SQL Server instances to fetch real-time sales data.
- **AI-Powered Summaries**: Integrates with OpenAI or DeepSeek to generate concise, professional executive summaries from your datasets.
- **Executive Dashboard**: A high-level view of profitability, revenue trends, and key performance indicators with interactive charts.
- **AI Chatbot Assistant**: Natural language querying of your sales data with automatic chart generation and deep insights.
- **Enhanced Reporting**:
  - **AI Intelligence Reports**: Every query now includes a professional executive summary and a suggested operational improvement actionable item.
  - **Rich Formatting**: AI summaries now feature tables, styled headers, and clear action items using Markdown.
  - **Performance Metrics**: View execution time and AI token usage for every query.
  - **Export Options**: One-click download of reports to PDF (with charts) and Excel.
  - **Visual Feedback**: Loading spinners and status indicators for a responsive user experience.
- **Vendor Range Analysis**: Detailed revenue and profit tracking by vendor with date filters.
- **Cashier Flash Report**: A dual-interface feature providing:
  - **Web Dashboard**: Real-time KPI cards (Sales, Transactions, Margin, ATV) and performance tables.
  - **CLI Tool**: A standalone Python application for advanced analytics and CSV/JSON exports.
- **Modern UI**: Custom background with glassmorphism effects for a premium look and feel.
- **Persistent Settings**: Remembers your database connection strings and credentials for seamless sessions.

## Recent Updates (February 2026)
- **Database Metrics Storage**: Execution time and token usage are now automatically stored in the database for historical analysis.
- **Enhanced PDF Exports**: Fixed chart rendering issues in PDF reports. Charts are now dynamically sized and correctly captured, ensuring they don't overlap with data tables.
- **AI-Powered Naming**: Report filenames are now intelligently suggested by AI based on the user's query context, keeping files organized and descriptive.
- **Bug Fixes**: Resolved critical UI blocking issues caused by background image conflicts and ensured stable application startup.

## Project Structure

- `/src`: React frontend components and assets.
- `/server`: Node.js backend handling SQL Server logic and AI integration.
- `/cashier_cli`: Standalone Python CLI tool for sales reports.
- `Start_AgSales.bat`: One-click startup script for Windows.

## Getting Started

### Prerequisites

- **Node.js**: (v18 or higher)
- **Python 3.x**: For the CLI tool.
- **SQL Server**: Access to a local or remote instance.
- **MCP Server (MSSQL)**: A running Model Context Protocol server. The setup script will attempt to install this for you automatically. **This is required for the app to function properly.**

### Installation & Quick Start (Windows)

1. Clone the repository:
   ```bash
   git clone https://github.com/cmaxtt/AgSalesAnalitics.git
   cd AgSalesAnalitics
   ```
2. **One-Click Startup**: Simply double-click `Start_AgSales.bat` in the root directory. This will automatically start the frontend, backend, and database connection.
3. Open `http://localhost:5151` in your browser.

### Manual Setup

1. **Frontend**: Run `npm install` and `npm run dev` in the root. This will automatically set up the MCP server if missing.
2. **Backend**: Run `npm install` and `node index.js` inside the `server` directory.
   - Note: The main `npm run dev` handles backend setup too.
3. **MCP Server**: The `setup:mcp` script will clone and set up the MCP server at `c:\AI-MCP\mssql_mcp_server`. Make sure to configure the `.env` file in that directory with your database credentials if automatic setup doesn't cover everything.
4. **CLI Tool**: Run `pip install -r cashier_cli/requirements.txt`.

## Usage - Cashier Flash Report

### Web Dashboard
- Navigate to **Cashier Analysis** in the sidebar.
- Select a date range and click **Run Analysis** to see live KPIs and AI summaries.

### CLI Tool
Run the python tool for manual reports:
```bash
python cashier_cli/cli_app.py --db-connection "YOUR_CONNECTION_STRING" --date-range "YYYY-MM-DD to YYYY-MM-DD"
```

## Database Schema

The application automatically manages the following tables for its internal features:

### Query Storage Tables (New)
1.  **`QueryHistory`**: 
    -   **Purpose**: Automatically logs every user query run against the chatbot.
    -   **Columns**: `ID`, `QueryText`, `GeneratedSQL`, `Timestamp`, `ExecutionTimeMs`, `TokenUsage`.
2.  **`QueryFavorites`**: 
    -   **Purpose**: Stores queries that users have explicitly marked as "Favorite".
    -   **Columns**: `ID`, `QueryText`, `GeneratedSQL`, `Note`, `Timestamp`, `ExecutionTimeMs`, `TokenUsage`.

## License

This project is licensed under the MIT License.
