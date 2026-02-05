import click
import sys
from db_handler import execute_cashier_report, DatabaseError
from analytics_engine import compute_cashier_analytics, get_summary_stats
from report_generator import render_console_report, export_csv, export_json

@click.command()
@click.option('--db-connection', required=True, help="Full ODBC Connection String.")
@click.option('--date-range', help="Date range filter in format 'YYYY-MM-DD to YYYY-MM-DD'.")
@click.option('--cashier', help="Filter by Cashier UserName.")
@click.option('--output', type=click.Choice(['console', 'csv', 'json']), default='console', help="Output format.")
@click.option('--analytics-level', type=click.Choice(['basic', 'full']), default='full', help="Level of analytics to compute.")
@click.option('--file-path', help="Output file path (required if output is csv or json).")
def cashier_report(db_connection, date_range, cashier, output, analytics_level, file_path):
    """
    Cashier Flash Report CLI Tool.
    Connects to SQL Server and generates advanced sales analytics.
    """
    click.echo(f"Initiating report with {analytics_level} analytics...")
    
    # Parse Date Range
    start_date = None
    end_date = None
    if date_range:
        try:
            if ' to ' in date_range:
                start_date, end_date = date_range.split(' to ')
            else:
                start_date = date_range
        except ValueError:
            click.echo("Error: Invalid date range format. Use 'YYYY-MM-DD to YYYY-MM-DD'.", err=True)
            sys.exit(1)

    try:
        # 1. Fetch Data
        df = execute_cashier_report(db_connection, start_date, end_date, cashier)
        
        # 2. Compute Analytics
        df_analyzed = compute_cashier_analytics(df, level=analytics_level)
        summary = get_summary_stats(df_analyzed)
        
        # 3. Output Results
        if output == 'console':
            render_console_report(df_analyzed, summary)
        elif output == 'csv':
            if not file_path:
                file_path = "cashier_report.csv"
            export_csv(df_analyzed, file_path)
        elif output == 'json':
            if not file_path:
                file_path = "cashier_report.json"
            export_json(df_analyzed, file_path)
            
    except DatabaseError as e:
        click.echo(f"Database Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"An unexpected error occurred: {e}", err=True)
        sys.exit(1)

if __name__ == '__main__':
    cashier_report()
