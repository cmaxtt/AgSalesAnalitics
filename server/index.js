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

const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, 'db_config.json');

// Helper to save connection config
const saveConfig = (config) => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error("Failed to save config:", err);
    }
};

// Helper to load connection config
const loadConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Failed to load config:", err);
    }
    return null;
};

// Auto-connect on startup
(async () => {
    const config = loadConfig();
    if (config) {
        try {
            console.log("Found saved config, attempting auto-connect...");
            await connectDB(config);
            console.log("Auto-connected to SQL Server.");
        } catch (err) {
            console.error("Auto-connect failed:", err.message);
        }
    }
})();

// 1. Connect Endpoint
app.post('/api/connect', async (req, res) => {
    const { server, database, user, password } = req.body;

    if (!server || !database) {
        return res.status(400).json({ error: 'Server and Database are required' });
    }

    try {
        await connectDB({ server, database, user, password });
        // Save successful config
        saveConfig({ server, database, user, password });
        res.json({ success: true, message: 'Connected to SQL Server successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Connection Failed', details: err.message });
    }
});

// Endpoint to check connection status
app.get('/api/connection-status', (req, res) => {
    const pool = getPool();
    res.json({ connected: !!pool });
});

// 2. Vendor Revenue Report Endpoint
app.post('/api/reports/vendor-revenue', async (req, res) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start Date and End Date are required' });
    }

    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'Not connected to database. Please connect via Settings.' });

    try {
        const query = `
            SELECT 
                v.VendorName,
                COUNT(DISTINCT i.InvoiceID) AS TotalInvoices,
                SUM(d.Quantity) AS TotalUnitsSold,
                
                -- Net Revenue: (Qty * Price) - Discount
                SUM((d.Quantity * d.PricePerUnit) - ISNULL(d.ItemDiscountValue, 0)) AS NetRevenue,
                
                -- Total Cost: Qty * Cost
                SUM(d.Quantity * d.CostPerUnit) AS TotalCost,
                
                -- Gross Profit
                SUM(((d.Quantity * d.PricePerUnit) - ISNULL(d.ItemDiscountValue, 0)) - (d.Quantity * d.CostPerUnit)) AS GrossProfit,
                
                -- Margin Percentage calculation with safety check for zero revenue
                CAST(
                    CASE 
                        WHEN SUM((d.Quantity * d.PricePerUnit) - ISNULL(d.ItemDiscountValue, 0)) = 0 THEN 0
                        ELSE (SUM(((d.Quantity * d.PricePerUnit) - ISNULL(d.ItemDiscountValue, 0)) - (d.Quantity * d.CostPerUnit)) / 
                              SUM((d.Quantity * d.PricePerUnit) - ISNULL(d.ItemDiscountValue, 0))) * 100 
                    END AS DECIMAL(10,2)
                ) AS MarginPct

            FROM tblInvoiceDetails d
            INNER JOIN tblInvoices i ON d.InvoiceID = i.InvoiceID
            INNER JOIN tblVendors v ON d.VendorID = v.VendorID
            WHERE i.InvoiceDate >= @startDate AND i.InvoiceDate <= @endDate
            GROUP BY v.VendorName
            ORDER BY NetRevenue DESC
        `;

        const request = pool.request();
        request.input('startDate', sql.DateTime, new Date(startDate));
        request.input('endDate', sql.DateTime, new Date(endDate));

        const result = await request.query(query);
        const rows = result.recordset;

        // Generate AI Summary
        let aiSummary = "AI Summary unavailable.";
        const llmConfig = getLLMClient();

        if (llmConfig && rows.length > 0) {
            try {
                // Summarize data for AI context (Top 15 vendors to manage token size)
                const topVendors = rows.slice(0, 15).map(r => ({
                    vendor: r.VendorName,
                    revenue: r.NetRevenue,
                    profit: r.GrossProfit,
                    margin: r.MarginPct.toFixed(1) + '%'
                }));

                const totals = rows.reduce((acc, curr) => ({
                    revenue: acc.revenue + curr.NetRevenue,
                    profit: acc.profit + curr.GrossProfit
                }), { revenue: 0, profit: 0 });

                const systemPrompt = "You are a specialized business intelligence analyst for AgSalesAnalytics. " +
                    "Your goal is to provide a concise, high-impact executive summary of the vendor performance data. " +
                    "Focus on revenue drivers, profit leaders, and margin anomalies. Use professional formatting.";

                const userPrompt = `Analyze the following vendor sales data from ${startDate} to ${endDate}. \n` +
                    `Total Period Revenue: $${totals.revenue.toFixed(2)}, Total Profit: $${totals.profit.toFixed(2)}. \n` +
                    `Top Vendor Data: ${JSON.stringify(topVendors)}. \n` +
                    `Provide 3 key insights and a concluding recommendation.`;

                if (llmConfig.provider === 'Gemini') {
                    const model = llmConfig.client.getGenerativeModel({ model: llmConfig.model });
                    const result = await model.generateContent(systemPrompt + "\n" + userPrompt);
                    aiSummary = result.response.text();
                } else {
                    const completion = await llmConfig.client.chat.completions.create({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        model: llmConfig.model,
                    });
                    aiSummary = completion.choices[0].message.content;
                }
            } catch (err) {
                console.error("AI Generation Error:", err);
                aiSummary = "Error generating AI analysis: " + err.message;
            }
        }

        res.json({
            data: rows,
            aiSummary: aiSummary
        });

    } catch (err) {
        console.error("Vendor Report Error:", err);
        res.status(500).json({ error: 'Report Generation Failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
