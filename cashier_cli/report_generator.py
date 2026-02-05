import pandas as pd
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

console = Console()

def render_console_report(df, summary, title="Cashier Flash Report"):
    """
    Renders the report to the console using Rich.
    """
    if df.empty:
        console.print("[yellow]No data found for the selected filters.[/yellow]")
        return

    table = Table(title=title, box=box.ROUNDED, header_style="bold cyan", border_style="bright_blue")

    # Add Columns
    table.add_column("Cashier", style="bold white")
    table.add_column("Date", justify="center")
    table.add_column("Register", justify="center")
    table.add_column("Sales (VI)", justify="right", style="green")
    table.add_column("Cost", justify="right")
    table.add_column("Trans", justify="right")
    table.add_column("Margin %", justify="right", style="bold yellow")
    table.add_column("ATV", justify="right", style="magenta")

    # Add Rows (Limit for console readability if too many)
    for index, row in df.head(50).iterrows():
        # Margin color logic
        margin_style = "bold yellow"
        if row['%Margin'] < 20:
            margin_style = "bold red"
        
        table.add_row(
            str(row['UserName']),
            str(row['InvoiceDate'].date() if hasattr(row['InvoiceDate'], 'date') else row['InvoiceDate']),
            str(row['Register']),
            f"${row['SalesVI']:,.2f}",
            f"${row['Cost']:,.2f}",
            str(int(row['Trans'])),
            f"[{margin_style}]{row['%Margin']:.2f}%[/{margin_style}]",
            f"${row['ATV']:.2f}"
        )

    console.print(table)

    # Render Summary Stats
    summary_panel = Panel(
        f"[bold cyan]TOTALS[/bold cyan]\n"
        f"Sales VI: [green]${summary['Total Sales VI']:,.2f}[/green] | "
        f"Cost: ${summary['Total Cost']:,.2f} | "
        f"GP: [bold green]${summary['Total Gross Profit']:,.2f}[/bold green]\n"
        f"Transactions: {summary['Total Transactions']} | "
        f"Avg Margin: [bold yellow]{summary['Overall Margin %']:.2f}%[/bold yellow] | "
        f"Avg ATV: [magenta]${summary['Overall ATV']:.2f}[/magenta]",
        title="Report Summary",
        border_style="cyan"
    )
    console.print(summary_panel)

def export_csv(df, filename):
    """Exports data to CSV."""
    df.to_csv(filename, index=False)
    console.print(f"[green]Report exported to CSV: {filename}[/green]")

def export_json(df, filename):
    """Exports data to JSON."""
    df.to_json(filename, orient='records', date_format='iso', indent=4)
    console.print(f"[green]Report exported to JSON: {filename}[/green]")
