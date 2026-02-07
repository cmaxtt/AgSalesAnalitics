const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, getPool, sql } = require('./db');
require('dotenv').config();
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { validateTable } = require('./utils/validation');
const { domainContext } = require('./utils/domainContext');

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

// Helper to fetch database schema context
const getSchemaContext = async (pool) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                t.name AS TableName,
                c.name AS ColumnName,
                ty.name AS DataType
            FROM sys.tables t
            INNER JOIN sys.columns c ON t.object_id = c.object_id
            INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
            WHERE t.name NOT LIKE 'sys%'
            ORDER BY t.name, c.column_id
        `);

        let schema = {};
        result.recordset.forEach(row => {
            if (!schema[row.TableName]) schema[row.TableName] = [];
            schema[row.TableName].push(`${row.ColumnName} (${row.DataType})`);
        });

        return Object.entries(schema).map(([table, cols]) =>
            `Table: ${table}\nColumns: ${cols.join(', ')}`
        ).join('\n\n');
    } catch (err) {
        console.error("Error fetching schema:", err);
        return "";
    }
};

// Chat Query Endpoint
app.post('/api/chat/query', async (req, res) => {
    const { userPrompt } = req.body;

    if (!userPrompt) {
        return res.status(400).json({ error: 'User prompt is required' });
    }

    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'Not connected to database.' });

    try {
        // 1. Get Schema Context
        const schemaContext = await getSchemaContext(pool);

        // 2. Prepare LLM Request
        const llmConfig = getLLMClient();
        if (!llmConfig) {
            return res.status(500).json({ error: 'LLM Client not configured.' });
        }

        const systemPrompt = `You are an expert SQL Data Analyst. Your task is to convert natural language queries into MSSQL T-SQL queries based on the provided schema and domain rules.
        
        Rules:
        1. return ONLY a JSON object with this format: { "sql": "SELECT ...", "explanation": "..." }
        2. Create ONLY SELECT statements. No INSERT, UPDATE, DELETE, DROP.
        3. Use standard T-SQL syntax.
        4. Handle date formatting and grouping as requested.
        5. If the request cannot be answered with the schema, return { "error": "Reason..." }
        6. Do not include markdown formatting (like \`\`\`json) in the response.

        ${domainContext}
        
        Database Schema:
        ${schemaContext}`;

        let generatedResponse = "";

        if (llmConfig.provider === 'Gemini') {
            const model = llmConfig.client.getGenerativeModel({ model: llmConfig.model });
            const result = await model.generateContent(systemPrompt + "\nUser Request: " + userPrompt);
            generatedResponse = result.response.text();
        } else {
            const completion = await llmConfig.client.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: llmConfig.model,
            });
            generatedResponse = completion.choices[0].message.content;
        }

        // Clean response if it contains markdown code blocks
        generatedResponse = generatedResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(generatedResponse);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse AI response', raw: generatedResponse });
        }

        if (parsedResponse.error) {
            return res.status(400).json({ error: parsedResponse.error });
        }

        // 3. Security Validation
        const sqlQuery = parsedResponse.sql;
        const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'EXEC', 'MERGE'];
        const upperSql = sqlQuery.toUpperCase();

        if (forbiddenKeywords.some(kw => upperSql.includes(kw))) {
            return res.status(403).json({ error: 'Generated query contains unsafe operations.' });
        }

        // 4. Execute Query
        console.log("Executing Generated Query:", sqlQuery);
        const request = pool.request();
        const result = await request.query(sqlQuery);

        res.json({
            success: true,
            sql: sqlQuery,
            explanation: parsedResponse.explanation,
            data: result.recordset
        });

    } catch (err) {
        console.error("Chat Query Error:", err);
        res.status(500).json({ error: 'Query Execution Failed', details: err.message });
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
            ORDER BY GrossProfit DESC
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

                const systemPrompt = "You are a senior Operations Analyst. Format your response using specific Markdown patterns as requested.";
                const userPrompt = `Analyze vendor sales data (${startDate} to ${endDate}).
Total Revenue: $${totals.revenue.toFixed(2)}, Profit: $${totals.profit.toFixed(2)}.
Top Vendors: ${JSON.stringify(topVendors)}.

STRICTLY usage the following Markdown format:

### 🔹 High-Performing Vendors
**[VENDOR NAME]**
- Revenue: **$[AMOUNT]**
- Profit: **$[AMOUNT]**
- Margin: **[PERCENT]%**
- Notes: [Brief insight]

(Repeat for top 2-3 vendors)

---

### 🔹 Margin Analysis & Flags
| Vendor | Margin (%) | Flag |
| :--- | :--- | :--- |
| [Name] | [Value] | ✅ Healthy / ⚠️ Low |
(List top 5)

---

### 🔹 Suggested Strategy
**Goal:** [One sentence goal]

**Action Plan:**
1. **[Action Item]** - [Description]
2. **[Action Item]** - [Description]

> ✅ [Closing positive note]`;

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

// 3. Cashier Flash Report Endpoint
app.post('/api/reports/cashier-flash', async (req, res) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start Date and End Date are required' });
    }

    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'Not connected to database. Please connect via Settings.' });

    try {
        const query = `
            SELECT 
                u.UserName, 
                i.InvoiceDate, 
                i.SalesPeriod, 
                SUM(i.SaleVat) AS SalesVat, 
                SUM(i.SaletotalVI) AS SalesVI, 
                SUM(i.SaleCost) AS Cost, 
                i.Register, 
                COUNT(i.InvoiceNo) AS Trans,
                ROUND(((SUM(i.SaletotalVI) - SUM(i.SaleCost)) / NULLIF(SUM(i.SaletotalVI), 0)) * 100, 2) AS [%Margin]
            FROM 
                dbo.tblInvoices i
            INNER JOIN 
                dbo.tblUsers u ON i.UserID = u.UserID
            WHERE i.InvoiceDate >= @startDate AND i.InvoiceDate <= @endDate
            GROUP BY 
                u.UserName, 
                i.InvoiceDate, 
                i.SalesPeriod, 
                i.Register
            HAVING 
                SUM(i.SaletotalVI) > 0
            ORDER BY 
                i.InvoiceDate DESC;
        `;

        const request = pool.request();
        request.input('startDate', sql.DateTime, new Date(startDate));
        request.input('endDate', sql.DateTime, new Date(endDate));

        const result = await request.query(query);
        const rows = result.recordset;

        // Generate AI Summary for Cashier Performance
        let aiSummary = "AI Summary unavailable.";
        const llmConfig = getLLMClient();

        if (llmConfig && rows.length > 0) {
            try {
                // Prepare context: Top cashiers by Sales and Margin
                const cashierData = rows.slice(0, 10).map(r => ({
                    cashier: r.UserName,
                    sales: r.SalesVI,
                    margin: r.MarginPct ? r.MarginPct.toFixed(1) : (r['%Margin'] ? r['%Margin'].toFixed(1) : '0') + '%',
                    trans: r.Trans
                }));

                const totals = rows.reduce((acc, curr) => ({
                    sales: acc.sales + curr.SalesVI,
                    cost: acc.cost + curr.Cost,
                    trans: acc.trans + curr.Trans
                }), { sales: 0, cost: 0, trans: 0 });

                const systemPrompt = "You are a senior Operations Analyst. Format your response using specific Markdown patterns as requested.";
                const userPrompt = `Analyze Cashier Performance (${startDate} to ${endDate}).
Total Sales: $${totals.sales.toFixed(2)}, Trans: ${totals.trans}.
Cashier Data: ${JSON.stringify(cashierData)}.

STRICTLY use the following Markdown format:

### 🔹 High-Performing Cashiers
**[CASHIER NAME]**
- Total Sales: **$[AMOUNT]**
- Transactions: **[COUNT]**
- Avg Sale: **$[AMOUNT]**
- Notes: [Brief insight]

(Repeat for top 2-3)

> ⚠️ **Note:** [Highlight any anomalies like low transaction counts with high values]

---

### 🔹 Margin Analysis & Flag
| Cashier | Margin (%) | Flag |
| :--- | :--- | :--- |
| [Name] | [Value] | ✅ Healthy / ⚠️ Monitor / ❌ Critical |
(List all provided)

---

### 🔹 Suggested Operational Improvement
**Goal:** [One sentence goal]

**Action Plan:**
1. **[Action Item]** - [Description]
2. **[Action Item]** - [Description]
3. **[Action Item]** - [Description]

> ✅ [Closing positive note]`;

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
                console.error("AI Generation Error (Cashier):", err);
                aiSummary = "Error generating AI analysis: " + err.message;
            }
        }

        res.json({
            data: rows,
            aiSummary: aiSummary
        });

    } catch (err) {
        console.error("Cashier Report Error:", err);
        res.status(500).json({ error: 'Report Generation Failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
