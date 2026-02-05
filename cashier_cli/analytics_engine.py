import pandas as pd
import numpy as np

def compute_cashier_analytics(df, level='full'):
    """
    Computes additional KPIs and trends using Pandas.
    """
    if df.empty:
        return df

    # Basic KPIs (Always added)
    df['GrossProfit'] = df['SalesVI'] - df['Cost']
    df['ATV'] = df['SalesVI'] / df['Trans']
    df['NetSales'] = df['SalesVI'] - df['SalesVat']
    df['EffectiveVatRate'] = (df['SalesVat'] / df['SalesVI']) * 100

    if level == 'full':
        # 1. Sales Growth (Period-over-period)
        # Sort by date for proper growth calculation
        df_sorted = df.sort_values(by='InvoiceDate')
        df['SalesGrowth'] = df_sorted.groupby('UserName')['SalesVI'].pct_change() * 100
        
        # 2. Cashier Ranking (by SalesVI and %Margin)
        df['SalesRank'] = df['SalesVI'].rank(ascending=False, method='min')
        df['MarginRank'] = df['%Margin'].rank(ascending=False, method='min')
        
        # 3. Anomaly Detection
        # Flag if %Margin < 20%
        df['MarginAnomaly'] = df['%Margin'] < 20
        
        # Average cost per transaction vs ATV
        df['AvgCostPerTrans'] = df['Cost'] / df['Trans']
        df['CostToATVRatio'] = (df['AvgCostPerTrans'] / df['ATV']) * 100
        
        # Deviation from average margin
        avg_margin = df['%Margin'].mean()
        df['MarginSkew'] = df['%Margin'] - avg_margin

    return df

def get_summary_stats(df):
    """
    Generates a summary row for totals and averages.
    """
    if df.empty:
        return {}
        
    summary = {
        'Total Sales VI': df['SalesVI'].sum(),
        'Total Cost': df['Cost'].sum(),
        'Total Gross Profit': df['GrossProfit'].sum() if 'GrossProfit' in df else (df['SalesVI'].sum() - df['Cost'].sum()),
        'Total Transactions': df['Trans'].sum(),
        'Overall Margin %': ((df['SalesVI'].sum() - df['Cost'].sum()) / df['SalesVI'].sum() * 100) if df['SalesVI'].sum() > 0 else 0,
        'Overall ATV': df['SalesVI'].sum() / df['Trans'].sum() if df['Trans'].sum() > 0 else 0
    }
    return summary
