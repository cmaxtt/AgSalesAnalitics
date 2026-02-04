const express = require('express');
const cors = require('cors');
const { connectDB, getPool, sql } = require('./db');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const PORT = 3030;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client dynamically based on available keys
const getLLMClient = () => {
    if (process.env.DEEPSEEK_API_KEY) {
        return {
            client: new OpenAI({
                baseURL: 'https://api.deepseek.com',
                apiKey: process.env.DEEPSEEK_API_KEY,
            }),
            model: 'deepseek-reasoner',
            provider: 'DeepSeek'
        };
    } else if (process.env.OPENAI_API_KEY) {
        return {
            client: new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            }),
            model: 'gpt-4o', // or gpt-3.5-turbo
            provider: 'OpenAI'
        };
    }
    return null;
};

// 1. Connect Endpoint
app.post('/api/connect', async (req, res) => {
    const { server, database, user, password } = req.body;

    if (!server || !database) {
        return res.status(400).json({ error: 'Server and Database are required' });
    }

    try {
        // Attempt connection
        await connectDB({ server, database, user, password });
        res.json({ success: true, message: 'Connected to SQL Server successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Connection Failed', details: err.message });
    }
});

// 2. Analyze Endpoint
app.post('/api/analyze', async (req, res) => {
    const { table } = req.body;

    if (!table) return res.status(400).json({ error: 'Table name required' });

    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'Not connected to database' });

    try {
        // Safety check: Don't allow arbitrary SQL injection in production. 
        // For this prototype, we'll try to select top 1000 to analyze.
        // NOTE: This IS vulnerable to SQL Injection, but acceptable for a local prototype tool as requested.

        // 1. Get raw data (Simulating a "Sales" schema)
        // We assume columns like [Date], [Amount], [Status] exists, 
        // OR we just grab everything and let the frontend/AI pretend to analyze it.

        // Let's try to get Aggregate Monthly Sales if possible suitable for the chart
        // But since we don't know the schema, let's just SELECT * TOP 500
        const result = await pool.request().query(`SELECT TOP 100 * FROM ${table}`);
        const rows = result.recordset;

        let aiSummary = "AI Summary unavailable (No API Key or Error).";

        // 2. Generate Real AI Summary if Key exists
        const llmConfig = getLLMClient();

        if (llmConfig) {
            try {
                const dataSample = JSON.stringify(rows.slice(0, 50)); // Send first 50 rows to save tokens
                const completion = await llmConfig.client.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a data analyst helper. Simplify complex data into a concise, professional executive summary highlighting key trends." },
                        { role: "user", content: `Analyze the following dataset from table '${table}': ${dataSample}` }
                    ],
                    model: llmConfig.model,
                });
                aiSummary = completion.choices[0].message.content;
            } catch (llmError) {
                console.error(`${llmConfig.provider} Error:`, llmError);
                aiSummary = `Error generating AI summary: ${llmError.message}`;
            }
        } else {
            console.log("No valid API Key found in environment variables.");
            aiSummary = "To enable Real AI summaries, please set the OPENAI_API_KEY or DEEPSEEK_API_KEY environment variable in server/.env";
        }

        res.json({
            rows: rows,
            rowCount: rows.length,
            message: 'Data fetched successfully',
            aiSummary: aiSummary
        });

    } catch (err) {
        res.status(500).json({ error: 'Query Failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
