# AgSalesAnalitics

A modern, interactive Sales Analytics web application designed to connect to SQL Server, analyze sales data, and provide AI-powered executive summaries.

## Features

- **Interactive UI**: Built with React and Vite for a fast, responsive user experience.
- **SQL Server Integration**: Connects to local or remote SQL Server instances to fetch real-time sales data.
- **AI-Powered Summaries**: Integrates with OpenAI or DeepSeek to generate concise, professional executive summaries from your datasets.
- **Executive Dashboard**: A high-level view of profitability, revenue trends, and key performance indicators with interactive charts.
- **AI Chatbot Assistant**: Natural language querying of your sales data with automatic chart generation and deep insights.
- **Enhanced Reporting**:
  - **Rich Formatting**: AI summaries now feature tables, styled headers, and clear action items using Markdown.
  - **Export Options**: One-click download of reports to PDF and Excel with smart timestamps.
  - **Visual Feedback**: Loading spinners and status indicators for a responsive user experience.
- **Vendor Range Analysis**: Detailed revenue and profit tracking by vendor with date filters.
- **Cashier Flash Report**: A dual-interface feature providing:
  - **Web Dashboard**: Real-time KPI cards (Sales, Transactions, Margin, ATV) and performance tables.
  - **CLI Tool**: A standalone Python application for advanced analytics and CSV/JSON exports.
- **Modern UI**: Custom background with glassmorphism effects for a premium look and feel.
- **Persistent Settings**: Remembers your database connection strings and credentials for seamless sessions.

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

### Installation & Quick Start (Windows)

1. Clone the repository:
   ```bash
   git clone https://github.com/cmaxtt/AgSalesAnalitics.git
   cd AgSalesAnalitics
   ```
2. **One-Click Startup**: Simply double-click `Start_AgSales.bat` in the root directory. This will automatically start the frontend, backend, and database connection.
3. Open `http://localhost:5151` in your browser.

### Manual Setup

1. **Frontend**: Run `npm install` and `npm run dev` in the root.
2. **Backend**: Run `npm install` and `node index.js` inside the `server` directory.
3. **CLI Tool**: Run `pip install -r cashier_cli/requirements.txt`.

## Usage - Cashier Flash Report

### Web Dashboard
- Navigate to **Cashier Analysis** in the sidebar.
- Select a date range and click **Run Analysis** to see live KPIs and AI summaries.

### CLI Tool
Run the python tool for manual reports:
```bash
python cashier_cli/cli_app.py --db-connection "YOUR_CONNECTION_STRING" --date-range "YYYY-MM-DD to YYYY-MM-DD"
```

## License

This project is licensed under the MIT License.
