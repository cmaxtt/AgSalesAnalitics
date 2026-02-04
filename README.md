# AgSalesAnalitics

A modern, interactive Sales Analytics web application designed to connect to SQL Server, analyze sales data, and provide AI-powered executive summaries.

## Features

- **Interactive UI**: Built with React and Vite for a fast, responsive user experience.
- **SQL Server Integration**: Connects to local or remote SQL Server instances to fetch real-time sales data.
- **AI-Powered Summaries**: Integrates with OpenAI or DeepSeek to generate concise, professional executive summaries from your datasets.
- **Visual Dashboards**: (Future enhancement) Beautiful charts and dashboards to visualize sales trends.
- **Security**: Environment variable support for sensitive API keys and database credentials.

## Technology Stack

- **Frontend**: React, Vite, Recharts, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, MSSQL (tedious), OpenAI SDK.
- **Aesthetics**: Custom Vanilla CSS with a modern, pastel/glassmorphism theme.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- SQL Server 2022 (Local or Remote)
- (Optional) OpenAI or DeepSeek API Key for AI summaries.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cmaxtt/AgSalesAnalitics.git
   cd AgSalesAnalitics
   ```

2. Install dependencies for the frontend:
   ```bash
   npm install
   ```

3. Install dependencies for the backend:
   ```bash
   cd server
   npm install
   cd ..
   ```

### Configuration

Create a `.env` file in the `server` directory:

```env
OPENAI_API_KEY=your_openai_key
# OR
DEEPSEEK_API_KEY=your_deepseek_key
```

### Running the App

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   # From the root directory
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5151`.

## License

This project is licensed under the MIT License.
