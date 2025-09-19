from dash import dash_table, html, dcc
import dash_bootstrap_components as dbc
import configparser
import redis
import pandas as pd
from sqlalchemy import engine_from_config
from dash_app.redis_con import r, fetch_data, username, password, hostname, database
from datetime import datetime
import base64
import io



data = fetch_data(r, username, password, hostname, database)
data.drop(columns=['id', 'asset_count'], inplace=True)
serial_no = pd.DataFrame([idx + 1 for idx in range(len(data))])
data.insert(0, 'S/N', serial_no)
def format_date(str_date):
    date = datetime.strptime(str_date, '%Y-%m-%d')
    return date.strftime('%d-%m-%Y')
data['date'] = data['date'].apply(lambda x: format_date(x))
data.columns = ['S/N', 'Name', 'Address', 'Phone No.', 'Product ID.', 'Latitude', 'Longitude', 'State', 'Date']
columns=[{'name':i, 'id':i} for i in data.columns]
total_entries = len(data)

# Function to generate download data
def generate_download_data(format_type='csv'):
    """Generate data in specified format for download"""
    if format_type == 'csv':
        return data.to_csv(index=False, encoding='utf-8')
    elif format_type == 'excel':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            data.to_excel(writer, index=False, sheet_name='Asset_Tracker_Data')
        return output.getvalue()
    elif format_type == 'json':
        return data.to_json(orient='records', indent=2)

customer_records = dbc.Container([
    # Download buttons section
    dbc.Row([
        dbc.Col([
            html.H5("Download Complete Data", className="mb-3"),
            dbc.ButtonGroup([
                dbc.Button([
                    html.I(className="fas fa-download me-2"),
                    "Download CSV"
                ], id="download-csv-btn", color="primary", outline=True, className="me-2"),
                dbc.Button([
                    html.I(className="fas fa-file-excel me-2"),
                    "Download Excel"
                ], id="download-excel-btn", color="success", outline=True, className="me-2"),
                dbc.Button([
                    html.I(className="fas fa-code me-2"),
                    "Download JSON"
                ], id="download-json-btn", color="info", outline=True)
            ], className="mb-3")
        ], width=12, className="text-center")
    ]),
    
    # Data table section
    dbc.Row([
        dbc.Col([
            dbc.Badge(f'Total Entries: {total_entries}', class_name='Badge fs-6', id='badge'),
            dbc.Spinner(dash_table.DataTable(
                id='customer_table',
                data = data.to_dict('records'),
                columns = columns ,
                style_cell = {'minWidth' :95, 'maxWidth':130},
                style_data = {'whiteSpace': 'normal', 'height':'auto', 'color': '#303030'},
                style_data_conditional = [{'if': {'row_index': 'odd'},'backgroundColor': '#EBEBE8'}],
                style_header = {'textAlign': 'center', 'whiteSpace': 'normal', 'height': 'auto', 'fontWeight': 'bold', 'color': '#222222', 'backgroundColor': '#EBEBE8'},
                style_filter = {'color': '#000000', 'backgroundColor': '#EBEBE8'},
                filter_action='native',
                sort_action='native',
                sort_mode='single',
                page_action= 'native',
                page_current=0,
                page_size=25,
                export_format='xlsx',
                export_headers='display',
                style_cell_conditional=(
                    [
                        {
                            'if': {'column_id': c}, 'textAlign':'left' 
                        } for c in ['Name', 'Address', 'State']
                    ] +
                    [
                        {
                            'if': {'column_id': c}, 'textAlign':'right' 
                        } for c in ['Phone No.', 'Product ID.']
                    ]
                ),
            ))
        ], class_name='col-xs-12 col-lg-10 shadow rounded')
    ],class_name='justify-content-center align-items-center gx-1'),
    
    # Hidden download components
    dcc.Download(id="download-csv"),
    dcc.Download(id="download-excel"),
    dcc.Download(id="download-json"),
    
], fluid=True)


