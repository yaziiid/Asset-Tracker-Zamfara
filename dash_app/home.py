from dash import dcc
import dash_bootstrap_components as dbc
import plotly.express as px
import configparser
from sqlalchemy import engine_from_config
import pandas as pd
import plotly.graph_objects as go
from dash_app.redis_con import username, password, hostname, database, mapboxAPI



#### Connection ####ƒ
config = {'db.url': f'mysql+pymysql://{username}:{password}@{hostname}/{database}'}
engine = engine_from_config(config, prefix='db.')

###### DataFrames #####
customer_profile_df = pd.read_sql_table('zamfara_customers', engine)
customer_profile_df.dropna(inplace=True, subset=['latitude', 'longitude'])
customer_profile_df['state'] = customer_profile_df['state'].apply(lambda x: 'Not Assigned' if x == None else x)




hovertemplate = ('<b>Name: </b>: %{customdata[1]} <br>' +
                '<b>Address: </b>: %{customdata[2]}<br>' + 
                '<b>Project ID.: </b>: %{customdata[3]}<br>' +
                '<b>State: </b>: %{customdata[7]}<br>')



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







customer_map = px.scatter_mapbox(
    customer_profile_df, lat='latitude', lon='longitude',
    hover_name='name', custom_data=['id', 'name', 'address', 'nin', 'asset_count', 'latitude', 'longitude', 'state'],
    hover_data={'name': False, 'latitude':False, 'longitude':False, 'asset_count':True},
    zoom=6, center=dict(lat=9.0765, lon=8),
    mapbox_style = 'carto-positron', height=800, )
customer_map.update_traces(marker=dict(size=12, color='#fe6b6b'), hovertemplate=hovertemplate)
customer_map.update_layout(
    legend =dict(title_text = '', orientation='h', x=0.4, font_size=15, font_color='#FFFFFF'), paper_bgcolor='#E5ECF6',
    margin = dict(l = 0, r = 0, t = 0, b = 0), mapbox_style="mapbox://styles/mapbox/streets-v12", mapbox_accesstoken=mapboxAPI,
    hoverlabel = dict(bgcolor="#666DE9", font_size=10, font_color='whitesmoke'),
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
    )

markdown_1 = f'''
            * **Name:** 
            * **Address:** 
            * **Project ID.: **
            * **State: ** 
            '''


home_layout = dbc.Container([
    dbc.Row([
        dbc.Col(dcc.Graph(figure=customer_map, id='customer_map', className='card', style={'height': '90vh'}), class_name='map mx-auto col-sm-12 rounded h-auto'),
    ], class_name='align-top')
], fluid=True, class_name='mt-2 mx-0 py-0 px-0 rounded')

engine.dispose()
