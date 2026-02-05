# Project Analysis: AgSalesAnalitics

## 1. Executive Summary
**AgSalesAnalitics** is a premium, full-stack business intelligence dashboard for visualizing and analyzing sales performance. 
It features a **Vite + React** frontend with a neon-dark aesthetic and a **Node.js + Express** backend that integrates with **Microsoft SQL Server (MSSQL)**. 
The core value proposition is the **AI-Intelligence Report**, which provides automated executive summaries of vendor performance using advanced LLMs (Gemini, DeepSeek, or OpenAI).

## 2. Technology Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Vanilla CSS with a Dark/Neon Green theme (`#0b1215`, `#4ade80`).
- **Icons:** `lucide-react` (for UI elements and AI branding).
- **UX Features:** 
  - Dynamic View Switching (Overview vs. Vendor Analysis).
  - Date Range Filtering (Defaults to 1st of previous month to today).
  - One-click Exports (Excel/CSV and PDF/Print).
  - Database Connection Settings Modal.

### Backend (`/server`)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database Driver:** `mssql` (Microsoft SQL Server)
- **Persistence:** Local JSON configuration (`db_config.json`) for persistent database credentials.
- **AI Clients:** 
  - `@google/generative-ai` (Gemini 1.5 Flash - Primary).
  - `openai` (DeepSeek and GPT-4o fallback).
- **Security:** `helmet` for headers, `cors` for safe cross-origin requests, `express-rate-limit` for DDoS protection.

## 3. Core Features & Implementation Details

### A. Vendor Revenue Analysis
A specialized dashboard providing deep insights into vendor-specific metrics:
- **Metrics Cloud:** Total Revenue, Gross Profit, Total Volume, and Avg Margin.
- **Data Table:** Dynamic sorting (default: Gross Profit Descending), precise header alignment, and currency formatting.
- **Date Range Picker:** Allows custom analysis periods with a rapid "Reset" function.

### B. AI-Intelligence Report
Automated business analysis pipeline:
1. **Extraction:** Backend executes a complex SQL query calculating Net Revenue, Cost, and Margin with discount handling.
2. **Contextualization:** Data for the top 15 vendors is packaged into a structured prompt.
3. **Reasoning:** AI generates 3 key insights and a professional recommendation.
4. **Presentation:** Visualized in a stylized, glassmorphism-inspired container with glowing accents.

### C. Persistent Database Connectivity
The application follows a "Connect Once" philosophy:
- **Settings Modal:** Users input server, database, user, and password.
- **Validation:** Connectivity is verified via a test query before saving.
- **Persistence:** Credentials are saved to `server/db_config.json` (git-ignored for security).
- **Auto-Connect:** On backend startup, the server automatically attempts to re-establish the link.

## 4. Database Schema Requirements
The application expects the following core MSSQL structure:
- **`tblVendors`**: `VendorID`, `VendorName`.
- **`tblInvoices`**: `InvoiceID`, `InvoiceDate`.
- **`tblInvoiceDetails`**: `InvoiceID`, `VendorID`, `Quantity`, `PricePerUnit`, `CostPerUnit`, `ItemDiscountValue`.

## 5. Security Best Practices
- **Credential Protection:** `db_config.json` and `.env` are strictly excluded via `.gitignore`.
- **Query Precision:** SQL calculations use `ISNULL` for discount safety and `CAST` for margin precision to avoid division-by-zero errors.
- **Print Optimization:** Custom `@media print` styles ensure professional PDF exports by hiding navigation and system controls.

## 6. How to Run
1. **Install Dependencies:** `npm install` in root and `server` folders.
2. **Environment:** Create `server/.env` with `GEMINI_API_KEY`.
3. **Execution:** Use `npm run dev` to start the Frontend (5151), Backend (3030), and MSSQL MCP Server concurrently.

---
*Document updated on 2026-02-05*
