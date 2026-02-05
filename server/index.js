const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, getPool, sql } = require('./db');
require('dotenv').config();
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { validateTable } = require('./utils/validation');

const app = express();
const PORT = 3030;

// Security Middleware
app.use(helmet());
app.use(cors()); // Configure origin in production
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize AI clients dynamically
const getLLMClient = () => {
    // 1. Priority: Gemini (Best for large context)
    if (process.env.GEMINI_API_KEY) {
        return {
            client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY),
            model: 'gemini-1.5-flash',
            provider: 'Gemini'
        };
    }
    // 2. DeepSeek
    else if (process.env.DEEPSEEK_API_KEY) {
        return {
            client: new OpenAI({
                baseURL: 'https://api.deepseek.com',
                apiKey: process.env.DEEPSEEK_API_KEY,
            }),
            model: 'deepseek-reasoner',
            provider: 'DeepSeek'
        };
    }
    // 3. OpenAI
    else if (process.env.OPENAI_API_KEY) {
        return {
            client: new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            }),
            model: 'gpt-4o',
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
        // SECURITY: Validate table existence to prevent SQL Injection
        const isValid = await validateTable(pool, table);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid or non-existent table name' });
        }

        // Fetch Data (Limit 1000 for safety, but safe to interpolate verified table name)
        const result = await pool.request().query(`SELECT TOP 1000 * FROM ${table}`);
        const rows = result.recordset;

        let aiSummary = "AI Summary unavailable (No API Key).";

        // Generate AI Summary
        const llmConfig = getLLMClient();

        if (llmConfig) {
            console.log(`Active AI Provider: ${llmConfig.provider}`);
            try {
                let prompt = "";

                if (llmConfig.provider === 'Gemini') {
                    // Gemini: Can handle full dataset
                    const model = llmConfig.client.getGenerativeModel({ model: llmConfig.model });
                    prompt = `Analyze the following sales data and provide a professional executive summary highlighting key trends, anomalies, and performance metrics. Data: ${JSON.stringify(rows)}`;

                    const result = await model.generateContent(prompt);
                    aiSummary = result.response.text();
                } else {
                    // others (OpenAI/DeepSeek): Truncate to save tokens/cost
                    const dataSample = JSON.stringify(rows.slice(0, 50));
                    const completion = await llmConfig.client.chat.completions.create({
                        messages: [
                            { role: "system", content: "You are a data analyst helper. Simplify complex data into a concise, professional executive summary." },
                            { role: "user", content: `Analyze this sample data from table '${table}': ${dataSample}` }
                        ],
                        model: llmConfig.model,
                    });
                    aiSummary = completion.choices[0].message.content;
                }
            } catch (llmError) {
                console.error(`${llmConfig.provider} Error:`, llmError);
                aiSummary = `Error generating AI summary: ${llmError.message}`;
            }
        }

        res.json({
            rows: rows,
            rowCount: rows.length,
            message: 'Data fetched successfully',
            aiSummary: aiSummary
        });

    } catch (err) {
        console.error("Analyze Error:", err);
        res.status(500).json({ error: 'Query Failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
