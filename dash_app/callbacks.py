from dash_extensions.enrich import Output, Input, State
from dash.exceptions import PreventUpdate
from dash_app.home import home_layout
from dash_app.enrol import form_layout
from urllib.parse import unquote
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dash_app.records import customer_records
from sqlalchemy import engine_from_config
import googlemaps
from dash_app.redis_con import r, fetch_data, username, password, hostname, database, mapboxAPI, geocodeAPI
from datetime import datetime
import pytz




# Define the available map styles
map_styles = [
    ("Streets", "mapbox://styles/mapbox/streets-v12"),
    ("Satellite", "mapbox://styles/mapbox/satellite-streets-v12"),
    ("Dark", "mapbox://styles/mapbox/dark-v11"),
]
# Create the button
buttons = []
for label, style in map_styles:
    buttons.append(
        dict(
            label=label,
            method="relayout",
            args=[{"mapbox.style": style}]
        )
    )
 # Adds button to map   
updatemenus=[
    go.layout.Updatemenu(
        buttons=buttons,
        direction="down",
        showactive=True,
        x=0,
        xanchor="left",
        y=1,
        yanchor="top"
        )
    ]


def register_callbacks(app):


    ##### Map and Geocode Config #####
    map_api = mapboxAPI
    gmaps = googlemaps.Client(key=geocodeAPI)


    content = ['home', 'register', 'records', 'search']

    collapse_at = ['home', 'search']

    @app.callback(
    Output("collapse", "is_open"),
    [Input("search", "n_clicks")],
    [Input('location', 'pathname')],
    [State("collapse", "is_open")],
    )
    def toggle_collapse(n, path, is_open):
        if unquote(path[1:]) not in collapse_at:
            return False
        if n:
            return not is_open
        return is_open

    @app.callback(
    Output("navbar-collapse", "is_open"),
    [Input("nav-toggler", "n_clicks")],
    [State("navbar-collapse", "is_open")],
    )
    def toggle_navbar_collapse(n, is_open):
        if n:
            return not is_open
        return is_open

    @app.callback(
    Output('content_container', 'children'),
    Output('home', 'active'),
    Output('register', 'active'),
    Output('records', 'active'),
    # Output('search', 'active'),
    Input('location', 'pathname')
    )
    def display_content(pathname):
        page = unquote(pathname[1:])
        if page in content:
            if page == 'home':
                return home_layout, True, False, False
            if page == 'register':
                return form_layout, False, True, False
            if page == 'records':
                return customer_records, False, False, True
            # if page == 'search':
            #     return search_layout, False, False, False, True
        else:
            if page != 'logout':
                return home_layout, True, False, False
    

    @app.callback(
        Output('location', 'pathname'),
        Input('customer_table','active_cell'),
        Input('customer_table','page_current'),
    )
    def show_clicked_data(cell, table_page):
        if not cell:
            raise PreventUpdate
        data = fetch_data(r, username, password, hostname, database)
        row_idx = cell['row'] + (table_page * 25)
        product_id = data.iloc[row_idx, :][4]
        r.set('table_click', str(product_id))

        return '/home'

    
    hovertemplate = ('<b>Name: </b> %{customdata[1]} <br>' +
                '<b>Address: </b> %{customdata[2]}<br>' + 
                '<b>Phone No.: </b> %{customdata[3]}<br>' +
                '<b>Product ID.: </b> %{customdata[4]}<br>' +
                '<b>State: </b> %{customdata[8]}<br>')
    

    @app.callback(
    Output('customer_map', 'figure'),
    Input('home', 'n_clicks'),
    Input('home_search', 'value'),

    # prevent_initial_call=True
    )
    def plot_map_points(n, search_value):
        data = fetch_data(r, username, password, hostname, database)
        data.dropna(inplace=True, subset=['latitude', 'longitude'])
        data['state'] = data['state'].apply(lambda x: 'Not Assigned' if x == None else x)
        value = search_value if search_value else r.get('table_click')
        r.delete('table_click')
        if value==None:
            customer_map = px.scatter_mapbox(
            data, lat='latitude', lon='longitude',
            hover_name='name', custom_data=['id', 'name', 'address', 'phone', 'nin', 'asset_count', 'latitude', 'longitude', 'state'],
            hover_data={'name': False, 'latitude':False, 'longitude':False, 'asset_count':True},
            zoom=6, center=dict(lat=9.0765, lon=8),
            )
            customer_map.update_traces(marker=dict(size=10, color='#fe6b6b'), hovertemplate = hovertemplate)
            customer_map.update_layout(
                legend =dict(title_text = "", orientation='h', x=0.4, font_size=15, font_color='#FFFFFF'), paper_bgcolor='#E5ECF6',
                margin = dict(l = 0, r = 0, t = 0, b = 0), mapbox_style="mapbox://styles/mapbox/streets-v12", mapbox_accesstoken=map_api,
                hoverlabel = dict(bgcolor="#666DE9", font_size=15, font_color='whitesmoke'), updatemenus=updatemenus
            )
        else:
            value = int(value)
            df = data[data['nin']==value]
            df = df.iloc[[0]]
            lat = df['latitude'].item()
            lon = df['longitude'].item()
            customer_map = px.scatter_mapbox(
                data, lat='latitude', lon='longitude',
                hover_name='name', custom_data=['id', 'name', 'address', 'phone', 'nin', 'asset_count', 'latitude', 'longitude', 'state'],
                hover_data={'name': False, 'latitude':False, 'longitude':False, 'asset_count':True},
                zoom=9, center=dict(lat=lat, lon=lon),
                )
            customer_map.update_traces(marker=dict(size=10, color='#fe6b6b'), hovertemplate = hovertemplate)
            customer_map.update_layout(
                legend =dict(title_text = "", orientation='h', x=0.4, font_size=15, font_color='#FFFFFF'), paper_bgcolor='#E5ECF6',
                margin = dict(l = 0, r = 0, t = 0, b = 0), mapbox_style="mapbox://styles/mapbox/streets-v12", mapbox_accesstoken=map_api,
                hoverlabel = dict(bgcolor="#666DE9", font_size=15, font_color='whitesmoke'), updatemenus=updatemenus
            )
            customdata_trace = [df['name'].item(), df['address'].item(), df['phone'].item(), df['nin'].item(), df['state'].item()]

            hovertemplate_trace = ('<b>Name: ' + customdata_trace[0] + '<br>' +
                        '<b>Address: </b> ' + customdata_trace[1] + '<br>' + 
                        '<b>Phone No.: </b> ' + customdata_trace[2] + '<br>' +
                        '<b>Product ID.: </b> ' + str(customdata_trace[3]) + '<br>' +
                        '<b>State: </b> ' + customdata_trace[4] + '<br>')
            customer_map.add_scattermapbox(
                below="", lat=[lat], lon=[lon], customdata=customdata_trace, hovertemplate=hovertemplate_trace,
                showlegend=False, name='',  hoverlabel = dict(bgcolor="#666DE9", font_size=15, font_color='whitesmoke'),
                marker=dict(size = 20, color='#76B947')
            )
            # r.delete('table_click')


        return customer_map
    
    



    @app.callback(
        Output('home_search', 'options'),
        Output('home_search', 'optionHeight'),
        Input("home_search", "search_value"),
        Input("home_search", "value"),
        # Input('cached_data', 'data')
    )
    def dropdown_items(search_value, value):
        data = fetch_data(r, username, password, hostname, database)
        data.dropna(inplace=True, subset=['latitude', 'longitude'])
        if not search_value:
            if not search_value and not value:
                return [{'label':None, 'value':None}], 0
            if not search_value and value:
                raise PreventUpdate
        nin = data['nin'].tolist()
        options = [{'label':str(product_id), 'value':product_id} for product_id in nin]

        return [o for o in options if o["label"].startswith(search_value)], 50
    

    @app.callback(
    Output('enrolment_alert', 'color'),
    Output('enrolment_alert', 'is_open'),
    Output('enrolment_alert', 'children'),
    Input('enrol_button', 'n_clicks'),
    State('customer_name', 'value'),
    State('form_address', 'value'),
    State('form_phone', 'value'),
    State('form_nin', 'value'),
    State('form_state', 'value'),
    prevent_initial_call=True
    )
    def enrolment_form(n, name, address, phone, nin, state):
        data = {'name': name, 'address': address, 'phone': phone, 'nin': nin, 'state':state}
        for i in data.values():
            if not i:
                color = 'danger'
                is_open = True
                msg = 'Please fill all the given fields'
                return color, is_open, msg
        coordinates = gmaps.geocode(address)

        try:
            lat = coordinates[0]['geometry']['location']['lat']
            lon = coordinates[0]['geometry']['location']['lng']
        except:
            color = 'danger'
            is_open = True
            msg = 'Please enter a valid address (address should contain atleast lga, state and country)'
            return color, is_open, msg
        config = {'db.url': f'mysql+pymysql://{username}:{password}@{hostname}/{database}'}
        engine = engine_from_config(config, prefix='db.')
        # engine = connect_with_connector()
        query = "insert into zamfara_customers (name, address, phone, nin, latitude, longitude, state, date) VALUES(%s, %s, %s, %s, %s, %s, %s, %s)"
        values = (name, address, phone, nin, lat, lon, state.title(), datetime.now(pytz.timezone('UTC')).date())
        try:
            with engine.connect() as conn:
                conn.execute(query, values)
            #set the new data to the redis cache
            df = pd.read_sql_table('zamfara_customers', engine)
            raw = df.to_csv(index=False)
            r.set('zamfara_customer_db', raw)
            engine.dispose()
            color = 'success'
            is_open = True
            msg = 'Customer enrolled successfully'
        except:
            engine.dispose()
            color = 'danger'
            is_open = True
            msg = 'Please enter the correct values on the given fields'
        records = fetch_data(r, username, password, hostname, database)
        records.drop(columns=['id', 'asset_count'], inplace=True)
        records.columns = ['Name', 'Address', 'Phone No.', 'Product ID.', 'Latitude', 'Longitude', 'State', 'Date']

        return color, is_open, msg


    @app.callback(
        Output('customer_name', 'value'),
        Output('form_address', 'value'),
        Output('form_phone', 'value'),
        Output('form_nin', 'value'),
        Output('form_state', 'value'),
        Input('enrol_button', 'n_clicks')
    )
    def clear_form(n):
        return '','','','',''
    

    @app.callback(
        Output('customer_table', 'data'),
        Output('badge', 'children'),
        Input('records', 'n_clicks')
    )
    def update_records(n):
        data = fetch_data(r, username, password, hostname, database)
        data.drop(columns=['id', 'asset_count'], inplace=True)
        serial_no = pd.DataFrame([idx + 1 for idx in range(len(data))])
        data.insert(0, 'S/N', serial_no)
        def format_date(str_date):
            date = datetime.strptime(str_date, '%Y-%m-%d')
            return date.strftime('%d-%m-%Y')
        data['date'] = data['date'].apply(lambda x: format_date(x))
        data.columns = ['S/N', 'Name', 'Address', 'Phone No.', 'Product ID.', 'Latitude', 'Longitude', 'State', 'Date']
        total_entries = len(data)
        str = f'Total Entries: {total_entries}'
        return data.to_dict('records'), str
    
