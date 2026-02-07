// Domain Knowledge Context for AI SQL Generation

const domainContext = `
-- DETAILED DOMAIN RULES AND PATTERNS --

1. SALES / DAILY SALES QUERIES:
   ALWAYS use this specific join pattern to link Invoices, Details, and Products.
   Tables: tblInvoices (Header), tblInvoiceDetails (Line Items), tblProducts (Product Info)
   
   Pattern:
   SELECT 
     i.InvoiceDate, 
     d.ProductCode, 
     d.Description, 
     SUM(d.Quantity) AS TotalQuantity, 
     p.StockingUM, 
     p.QuantityOnHand,
     SUM(d.Quantity * d.PricePerUnit) AS TotalRevenue
   FROM dbo.tblInvoiceDetails AS d
   INNER JOIN dbo.tblInvoices AS i ON d.InvoiceID = i.InvoiceID
   INNER JOIN dbo.tblProducts AS p ON d.ProductCode = p.ProductCode
   -- Add filters here (e.g. WHERE i.InvoiceDate >= ...)
   GROUP BY i.InvoiceDate, d.ProductCode, d.Description, p.StockingUM, p.QuantityOnHand

2. TABLE RELATIONSHIPS:
   - tblInvoices.InvoiceID = tblInvoiceDetails.InvoiceID (One-to-Many)
   - tblInvoiceDetails.ProductCode = tblProducts.ProductCode (Many-to-One)
   - tblInvoiceDetails.VendorID = tblVendors.VendorID (Many-to-One)
   - tblInvoices.UserID = tblUsers.UserID (Many-to-One)

3. CALCULATION RULES:
   - Net Revenue = (Quantity * PricePerUnit) - ItemDiscountValue
   - Gross Profit = Net Revenue - (Quantity * CostPerUnit)
   - Margin % = (Gross Profit / Net Revenue) * 100
`;

module.exports = { domainContext };
