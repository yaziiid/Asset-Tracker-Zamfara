from dash import dash_table
import dash_bootstrap_components as dbc
import configparser
import redis
import pandas as pd
from sqlalchemy import engine_from_config
from dash_app.redis_con import r, fetch_data, username, password, hostname, database
from datetime import datetime



data = fetch_data(r, username, password, hostname, database)
data.drop(columns=['id', 'asset_count'], inplace=True)
serial_no = pd.DataFrame([idx + 1 for idx in range(len(data))])
data.insert(0, 'S/N', serial_no)
def format_date(str_date):
    date = datetime.strptime(str_date, '%Y-%m-%d')
    return date.strftime('%d-%m-%Y')
data['date'] = data['date'].apply(lambda x: format_date(x))
data.columns = ['S/N', 'Name', 'Address', 'Project ID.', 'Latitude', 'Longitude', 'State', 'Date']
columns=[{'name':i, 'id':i} for i in data.columns]
total_entries = len(data)

customer_records = dbc.Container(
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
                style_cell_conditional=(
                    [
                        {
                            'if': {'column_id': c}, 'textAlign':'left' 
                        } for c in ['Name', 'Address', 'State']
                    ] +
                    [
                        {
                            'if': {'column_id': c}, 'textAlign':'right' 
                        } for c in ['Project ID.']
                    ]
                ),
            ))
        ], class_name='col-xs-12 col-lg-10 shadow rounded')
    ],class_name='justify-content-center align-items-center gx-1'), 
    fluid=True)


