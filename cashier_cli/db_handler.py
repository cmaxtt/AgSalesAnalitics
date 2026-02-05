import pyodbc
import pandas as pd
import logging
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Custom exception for database-related errors."""
    pass

@contextmanager
def get_db_connection(connection_string):
    """
    Context manager for handling SQL Server connections.
    """
    conn = None
    try:
        conn = pyodbc.connect(connection_string, timeout=10)
        yield conn
    except pyodbc.Error as e:
        logger.error(f"Database connection error: {e}")
        raise DatabaseError(f"Failed to connect to the database: {e}")
    finally:
        if conn:
            conn.close()

def execute_cashier_report(connection_string, start_date=None, end_date=None, cashier=None):
    """
    Executes the Cashier Flash Report SQL query with optional filters.
    """
    base_query = """
    SELECT 
        dbo.tblUsers.UserName, 
        dbo.tblInvoices.InvoiceDate, 
        dbo.tblInvoices.SalesPeriod, 
        SUM(dbo.tblInvoices.SaleVat) AS SalesVat, 
        SUM(dbo.tblInvoices.SaletotalVI) AS SalesVI, 
        SUM(dbo.tblInvoices.SaleCost) AS Cost, 
        dbo.tblInvoices.Register, 
        COUNT(dbo.tblInvoices.InvoiceNo) AS Trans,
        ROUND(((SUM(dbo.tblInvoices.SaletotalVI) - SUM(dbo.tblInvoices.SaleCost)) / NULLIF(SUM(dbo.tblInvoices.SaletotalVI), 0)) * 100, 2) AS [%Margin]
    FROM 
        dbo.tblInvoices 
    INNER JOIN 
        dbo.tblUsers ON dbo.tblInvoices.UserID = dbo.tblUsers.UserID
    WHERE 1=1
    """
    
    params = []
    
    if start_date:
        base_query += " AND dbo.tblInvoices.InvoiceDate >= ?"
        params.append(start_date)
    if end_date:
        base_query += " AND dbo.tblInvoices.InvoiceDate <= ?"
        params.append(end_date)
    if cashier:
        base_query += " AND dbo.tblUsers.UserName = ?"
        params.append(cashier)
        
    base_query += """
    GROUP BY 
        dbo.tblUsers.UserName, 
        dbo.tblInvoices.InvoiceDate, 
        dbo.tblInvoices.SalesPeriod, 
        dbo.tblInvoices.Register
    HAVING 
        SUM(dbo.tblInvoices.SaletotalVI) > 0
    ORDER BY 
        dbo.tblInvoices.InvoiceDate DESC;
    """
    
    try:
        with get_db_connection(connection_string) as conn:
            df = pd.read_sql(base_query, conn, params=params)
            return df
    except Exception as e:
        logger.error(f"Error executing report query: {e}")
        raise DatabaseError(f"Query execution failed: {e}")
