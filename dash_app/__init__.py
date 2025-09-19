from dash_extensions.enrich import  DashProxy, html, dcc, ServersideOutputTransform
import dash_bootstrap_components as dbc
from dash_app.callbacks import register_callbacks
from dash_app.home import home_layout
from dash_app.enrol import form_layout
from dash_app.records import customer_records
from dash_app.search import search_layout
from flask_login import login_required




style_2 = {
}
nav = dbc.Nav([
        dbc.NavItem(dbc.NavLink("Home", id='home', href='/home', style=style_2),  class_name='me-1'),
        dbc.NavItem(dbc.NavLink("Register Project", id='register', href='/register', style=style_2),  class_name='me-1'),
        dbc.NavItem(dbc.NavLink("Records", id='records', href='/records', style=style_2),  class_name='me-1'),
        # dbc.NavItem(dbc.NavLink("Search", id='search', href='/search', style=style_2), class_name='me-1'),
        dbc.NavItem(dbc.NavLink("Search", id='search', href='/home', style=style_2), class_name='me-1'),
        dbc.NavItem(dbc.NavLink("Logout", id='logout', href='/logout', style=style_2, external_link=True), class_name='me-1'),

],navbar=True, justified=True, class_name='ms-auto fs-4')

collapse__ = html.Div(
    [
        dbc.Button(
            "Open collapse",
            id="collapse-button",
            className="m",
            color="primary",
            n_clicks=0,
        ),
    ]
)
search_col = dbc.Container([
    dbc.Collapse(
            dbc.Card([
                dbc.Row([
                    dbc.Col(dcc.Dropdown(id = 'home_search', placeholder= 'search project id ', className='dropdown me-auto', optionHeight=50,), className=''), #persistence_type='session'
                    # dbc.Col(html.I(id='submit-button', n_clicks=0, className='fa-2x fa-solid fa-magnifying-glass', style={'height':'30px', 'width':'30px'}), class_name='col-3 pt-1 font-col')
                    # dbc.Col(html.A(html.Img(src='assets/search-icon.svg', style={'height':'30px', 'width':'30px'}, className='ml-3 mx-auto search-icon'), href='/home', className='a-tag'), class_name='col-3 pt-1')
                ], class_name='')
            ], class_name='ms-auto col-sm-6. col-lg-2 align-center'),
            id="collapse",
            is_open=False,
        )
], class_name='justify-content-center', fluid=True)
navbar3 = dbc

navbar_2 = dbc.Navbar(
            dbc.Container([
                    html.A([
                        dbc.Row([
                            dbc.Col([
                                html.Img(src='assets/nigeria_coat_of_arms.png', className='nav_logo1 img-fluid'),
                                # html.Label("TBCN", htmlFor='nav_logo1', className='nav_logo1 tbcn-label')
                            ], style={'border-right': '1px solid #303030'}, class_name="tbcn-logo-div"), #, width=200, height=80
                            dbc.Col(html.Img(src='assets/nigeria_coat_of_arms.png',className='nav_logo2 img-fluid')), #, width=80, height=80
                        ], class_name='logo-div'),
                    ], href='/', style={"textDecoration": "none"}),
                # dbc.Col(html.H2('Save-80 Asset Tracker', className='mx-auto d-none d-lg-block'), class_name='ml-5'),
                html.H2('National Infrastructure Management System', className='ms-5 d-none d-lg-block text-center fs-2', style={'font-family': 'Abril Fatface', 'color': '#333333', }), #'margin-left': '35%'
                dbc.NavbarToggler(id='nav-toggler'),
                dbc.Collapse(nav, id='navbar-collapse', is_open=False, navbar=True, class_name='')
            ], fluid=True, class_name='text-center')
        , class_name='navbar text-center navbar-expand-md', id='navbar')

# navbar = dbc.Navbar(
#     dbc.Container([
#         dbc.Col([
#             html.A([
#                 dbc.Row([
#                     dbc.Col([
#                         html.Img(src='assets/naseni_logo.png', width=110, height=110,className='mt-2 navbar-brand rounded float-start')
#                         # html.Img(src='assets/tbcn-logo2.png', width=160, height=90,className='mt-3 navbar-brand rounded float-start'),
#                         # html.Small('To Be Connected Nigeria', className='light')
#                     ], class_name='col-3 align-center py-0'),
#                 ], align='center', className='g-0'),
#             ], href='/'),
#         ], align='start', class_name='col-3'),
#         dbc.Col([
#             html.H2('Save-80 Asset Tracker',), #style={'color':'#B8E1E9'}
#             dbc.NavbarToggler(id='nav-toggler', n_clicks=0),
#             dbc.Collapse(nav, id='navbar-collapse', is_open=False, navbar=True),
#         ],class_name='col-6 text-center header-text align-center gy-0'),
#         dbc.Col([
#              dcc.Dropdown(
#                 id = 'home_search', placeholder= 'search name or project id ', className='dropdown nav-search me-auto', optionHeight=50,
#             )
#         ], class_name='ms-auto mt-3'),
#         dbc.Col(
#             html.Img(src='assets/atmosfair2.png', width=200, height=90, className='mt-4 navbar-brand rounded atmos_logo float-end') #className='navbar-brand rounded float-end atmos_logo
#         )
#     ], fluid=True, class_name='d-flex justify-content-center py-0')
# ,id='navbar', class_name='navbar')


FOOTER_STYLE = {
    "position": "fixed",
    "bottom": 0,
    "left": 0,
    "right": 0,
    'height':'30px',
    'background': '#3F4F75',
    # 'background': '-webkit-linear-gradient(to top, #2c3e50, #bdc3c7)',
    # 'background': 'linear-gradient(to top, #2c3e50, #bdc3c7)',


}
content_con = {
    # 'backround-color': '#606c88',
    # 'background': '-webkit-linear-gradient(0deg, #606c88 0%, #3f4c6b 100%)',
    # 'background': 'linear-gradient(0deg, #606c88 0%, #3f4c6b 100%)',
    'background-image': 'url(assets/background.jpg)'
}

main_layout = dbc.Container([
    html.Meta(name = "viewport", content = "width=device-width, initial-scale=1"),
    dcc.Store(id='cached_data'),
    dcc.Store(id='table_click', storage_type='session'),
    dcc.Location(id='location'),
    dcc.Interval(id='query_data', interval=15*1000),
    dbc.Row(navbar_2, class_name='sticky-top text-center'),
    dbc.Row(dbc.Col([search_col])),
    dbc.Row(
            dbc.Col(id='content_container', lg={'size':12}, class_name='content-con') #content_con
        ),
    # dbc.Row([
    #     # dbc.Col([
    #     #     # html.Small('13b, Mambila Street, Aso Drive, Abuja.', className='m-info d-inline'), #, style={'color':'#B8E1E9'}
    #     #     html.A('www.tbcn.com.ng', href='http://tbcn.com.ng', className = 'm-info me-auto  mt-4',style={'color':'#00738A'}) #style={'color':'#B8E1E9'}
    #     # ], class_name='info_footer ', style={'padding-left':'30px'}),
    #     dbc.Col([
    #         html.H3('powered by Metaverse®', className='footer_text')#style={'color':'whitesmoke'}
    #     ], class_name='text-center footer'),
    #     # dbc.Col([
    #     #     html.Small('TBCN® ©2022', className='m-info ms-auto  mt-4'), #, style={'color':'#B8E1E9'}
    #     #     # html.Small('2022©', className='ms-auto') #, style={'color':'#B8E1E9'}
    #     # ], class_name='text-center info_footer', style={'padding-right':'30px'})
    # ], class_name='d-flex justify-content-center',  style=FOOTER_STYLE)    
], fluid=True, class_name='main_content')







meta_tags=[{'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}]




font_awesome = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css'



def create_dash_app(server):
    dash_app = DashProxy(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.FONT_AWESOME], transforms=[ServersideOutputTransform()], server=server, url_base_pathname='/', meta_tags=meta_tags)
    dash_app.title = "Save-80"
    # server = dash_app.server
    dash_app.validation_layout = html.Div([main_layout, home_layout, form_layout, customer_records, search_layout])
    dash_app.layout = main_layout

    register_callbacks(dash_app)
    _protect_dashviews(dash_app)
    return dash_app


def _protect_dashviews(dashapp):
    for view_func in dashapp.server.view_functions:
        if view_func.startswith(dashapp.config.url_base_pathname):
            dashapp.server.view_functions[view_func] = login_required(
                dashapp.server.view_functions[view_func])
