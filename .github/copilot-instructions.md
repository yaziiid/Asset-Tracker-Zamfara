# Asset Tracker Zamfara

Asset Tracker Zamfara is a Flask web application with integrated Plotly Dash dashboard for geographical asset tracking in Zamfara State, Nigeria. The application provides user authentication, customer enrollment with address geocoding, interactive maps, and comprehensive records management.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Initial Setup and Dependencies
- **CRITICAL**: Install Python 3.10.4 (as specified in runtime.txt):
  - `python3 --version` should show 3.10.x or compatible
  - If not available, download from: https://www.python.org/downloads/release/python-31004/
- Install all dependencies:
  - `pip3 install -r requirements.txt`
  - **NEVER CANCEL**: This takes 15-30 minutes due to 87 dependencies including Dash, Plotly, and geospatial libraries. Set timeout to 45+ minutes.
  - **NETWORK ISSUES COMMON**: If pip install fails due to network timeouts, try these approaches:
    - `pip3 install --timeout 1000 --retries 5 -r requirements.txt`
    - `pip3 install --no-cache-dir -r requirements.txt`
    - Install in smaller batches: `pip3 install flask dash plotly` then `pip3 install -r requirements.txt`
  - **CRITICAL PACKAGES**: These must be installed for basic functionality:
    - `flask`, `dash`, `plotly`, `mysql-connector-python`, `googlemaps`, `redis`, `flask-sqlalchemy`, `flask-login`
  - **EXPECTED FAILURES**: Network timeouts are common - keep retrying until successful

### Configuration Setup
- **REQUIRED**: Configure database and API keys in `cloud_db.ini`:
  ```ini
  [HOST_DATA]
  hostname = your-mysql-host
  redisHost = redis://your-redis-url
  
  [USER_DATA]
  username = your-mysql-username
  password = your-mysql-password
  database = your-database-name
  SECRET_KEY = your-secret-key
  geocodeAPI = your-google-maps-api-key
  mapboxAPI = your-mapbox-api-key
  ```
- **REQUIRED**: Configure email settings in `mailconfig.ini`:
  ```ini
  [MAIL_HOST]
  hostname = smtp.gmail.com
  
  [MAIL_USER]
  username = your-email@gmail.com
  password = your-app-password
  ```

### Running the Application
- **Prerequisites validation**:
  ```bash
  python3 -c "import flask, dash, plotly, redis, mysql.connector, googlemaps; print('All core dependencies available')"
  ```
  If this fails, the application cannot start.

- **Development mode**: 
  - `python3 main.py`
  - Application runs on default Flask port (5000)
  - Access at: http://localhost:5000
  - **EXPECTED STARTUP TIME**: 10-15 seconds for initial database connections and Redis setup

- **Production mode** (Heroku-style):
  - `gunicorn main:app`
  - Uses configuration from Procfile: `web: gunicorn main:app`
  - **NEVER CANCEL**: Gunicorn startup can take 30+ seconds

- **Debug mode**:
  - Set `app.run(debug=True)` in main.py for auto-reload during development
  - **WARNING**: Debug mode exposes sensitive configuration - use only in development

- **Startup failure indicators**:
  - `ImportError`: Missing Python dependencies
  - `mysql.connector.errors`: Database connection issues
  - `redis.exceptions.ConnectionError`: Redis connection issues
  - `googlemaps.exceptions.ApiError`: Invalid Google Maps API key

### Build and Test Process
- **No formal test suite**: This project does not include unit tests or integration tests
- **No linting configuration**: No flake8, black, or other linting tools configured
- **Manual validation only**: Test functionality through the web interface
- **Build time**: Initial pip install takes 15-25 minutes. Subsequent runs are instant.
- **NEVER CANCEL**: Always wait for pip install to complete, even if it appears hung

## Validation and Testing

### Manual Testing Scenarios
**ALWAYS** manually validate changes by running through these complete user scenarios:

1. **Authentication Flow**:
   - Register new user at `/register`
   - Check email verification (requires working email config)
   - Login at `/login`
   - Verify redirect to dashboard

2. **Customer Enrollment Flow**:
   - Navigate to "Register" tab
   - Fill customer form: name, address, phone, NIN, state
   - Submit form - should geocode address and save to database
   - Verify success message and data appears in Records

3. **Dashboard Interaction**:
   - Home page should show interactive map with customer locations
   - Test map controls: zoom, pan, style switching
   - Click on map markers to view customer details
   - Test search functionality

4. **Records Management**:
   - Navigate to "Records" tab
   - Verify customer data table loads
   - Test table interactions (sorting, pagination if applicable)

### Database Dependencies
- **MySQL database required**: Application will not start without valid database connection
- **Database schema**: Tables include `zamfara_customers` and `zamfara_users`
- **Redis cache required**: Used for performance optimization of customer data
- **Geographic data**: Requires Google Maps Geocoding API for address validation

### API Dependencies
- **Google Maps Geocoding API**: Required for address-to-coordinates conversion
- **Mapbox API**: Required for map rendering and styles
- **Email service**: Required for user registration verification

## Key Architecture Components

### Main Application Structure
```
main.py                 # Flask app with authentication, forms, routes
├── User class          # SQLAlchemy model for authentication
├── Form classes        # WTForms for registration, login, password reset
├── Routes              # /register, /login, /logout, /verify, /reset_password
└── create_dash_app()   # Integration point with Dash dashboard

dash_app/
├── __init__.py         # Dash app initialization, navigation, main layout
├── callbacks.py        # Interactive dashboard callbacks and business logic
├── home.py             # Dashboard home page with interactive maps
├── enrol.py            # Customer enrollment forms and validation
├── records.py          # Customer records display and management
├── search.py           # Search functionality (currently minimal)
└── redis_con.py        # Redis connection, data fetching, caching logic

templates/              # Jinja2 templates for Flask authentication pages
├── layout.html         # Base template with Bootstrap styling
├── login.html          # User login form
├── register.html       # User registration form
└── *-mail.html         # Email templates for verification/reset

static/                 # CSS, images, logos
├── signin.css          # Custom authentication styling
└── *.png               # Logos (Zamfara state, TBCN, NCCC, NNPC)

Configuration Files:
├── cloud_db.ini        # Database, Redis, API keys configuration
├── mailconfig.ini      # SMTP email configuration
├── requirements.txt    # 87 Python dependencies
├── runtime.txt         # Python 3.10.4 specification
└── Procfile           # Heroku deployment: "web: gunicorn main:app"
```

#### Flask Application (main.py)
- **User class**: SQLAlchemy model with authentication methods
  - `verify_email_token()`, `get_reset_token()`, `verify_reset_token()`
- **Form classes**: WTForms for user input validation
  - `RegistrationForm`, `LoginForm`, `RequestResetForm`, `ResetPasswordForm`
- **Routes**: Standard Flask authentication flow
  - `/register`, `/login`, `/logout`, `/verify/<token>`, `/reset_password`
- **Email integration**: Flask-Mail for verification and password reset

#### Dash Dashboard (dash_app/)
- **Main callbacks in callbacks.py**:
  - `register_callbacks()`: Central function registering all interactive components
  - `toggle_collapse()`, `toggle_navbar_collapse()`: Navigation controls
  - `display_content()`: Page routing and content switching
  - `enrolment_form()`: Customer registration with geocoding
  - `plot_map_points()`: Dynamic map visualization with customer data
- **Data flow**:
  - `redis_con.py` → `fetch_data()` → Redis cache or MySQL fallback
  - `home.py` → Map visualization with Plotly/Mapbox
  - `enrol.py` → Customer forms with address validation
  - `records.py` → Data table display

#### Integration Architecture
- **Flask-Dash integration**: `create_dash_app(server)` in `dash_app/__init__.py`
- **Authentication bridge**: `_protect_dashviews()` applies Flask-Login to Dash routes
- **Shared configuration**: Both apps use same `cloud_db.ini` and `mailconfig.ini`
- **Database sharing**: SQLAlchemy models accessible from both Flask and Dash components

### Database Schema
- `zamfara_users`: User authentication (id, username, email, password, email_verified)
- `zamfara_customers`: Customer data (id, name, address, phone, nin, latitude, longitude, state, asset_count, date)

### External Integrations
- **Google Maps**: Geocoding addresses to lat/lon coordinates
- **Mapbox**: Map rendering with multiple style options
- **Redis**: Caching customer data with 24-hour expiration
- **MySQL**: Primary data storage
- **SMTP**: Email verification and password reset

## Common Development Tasks

## Common Development Tasks

### Development Workflow
1. **Start development environment**:
   ```bash
   cd /path/to/Asset-Tracker-Zamfara
   python3 main.py  # Starts on localhost:5000
   ```
2. **Test database connection**: Visit `/register` - should load without errors
3. **Test Redis connection**: Check browser console for errors on dashboard pages
4. **Test API integrations**: Try customer enrollment with real address

### Adding New Features
- **Map components**: 
  - Modify `dash_app/home.py` for layout changes
  - Add callbacks in `dash_app/callbacks.py` for interactivity
  - Update `plot_map_points()` function for new data visualization
- **Customer data fields**: 
  - Update database schema in MySQL
  - Modify `dash_app/enrol.py` for form fields
  - Update `dash_app/records.py` for display
  - Adjust `enrolment_form()` callback in `callbacks.py`
- **Authentication features**: 
  - Add routes and forms in `main.py`
  - Create new templates in `templates/`
  - Update `User` class methods as needed
- **UI styling**: 
  - Update templates in `templates/` for Flask pages
  - Modify Dash layouts in `dash_app/*.py` files
  - Edit `static/signin.css` for authentication styling

### Code Modification Patterns
- **Always** test database queries in `redis_con.py` when changing data access
- **Always** update both Redis cache structure and MySQL queries together
- **Always** test both authentication (Flask) and dashboard (Dash) after integration changes
- **Always** verify Google Maps geocoding still works after address field changes

### Debugging Common Issues
- **Database connection errors**: Check `cloud_db.ini` configuration
- **Map not loading**: Verify `mapboxAPI` key in `cloud_db.ini`
- **Geocoding failures**: Verify `geocodeAPI` key and address format
- **Email not sending**: Check `mailconfig.ini` and app password settings
- **Redis errors**: Verify Redis connection string in `cloud_db.ini`

### Performance Considerations
- **Redis caching**: Customer data cached for 24 hours, cleared on new registrations
- **Database connections**: Use connection pooling, dispose engines after use
- **Map rendering**: Large datasets may require pagination or clustering

## Important File Locations

### Frequently Modified Files
- `main.py` - Main application logic, authentication, routes
- `dash_app/callbacks.py` - Interactive dashboard behavior
- `dash_app/home.py` - Map visualization and layout
- `cloud_db.ini` - Database and API configuration
- `requirements.txt` - Python dependencies

### Configuration Files
- `runtime.txt` - Python version specification (python-3.10.4)
- `Procfile` - Heroku deployment configuration (web: gunicorn main:app)
- `.gitignore` - Excludes __pycache__, local_db.ini, .gcloudignore, file_system_store, dump.rdb

### Asset Files
- `static/zamfara_logo.png` - State government logo
- `static/signin.css` - Authentication page styling
- `templates/layout.html` - Base template for auth pages

## Troubleshooting

### Installation Issues
- **Pip timeouts**: Use `pip3 install --timeout 1000 --retries 5 -r requirements.txt`
- **Network connectivity**: PyPI access may be limited in some environments - try multiple times
- **ReadTimeoutError**: This is a common issue - wait and retry, don't use different packages
- **Geospatial libraries**: May require system dependencies like GDAL on some systems
- **MySQL connector**: Requires MySQL client libraries
- **Build dependencies**: Some packages (aiohttp, cffi, Brotli) require compilation and may take extra time
- **ALTERNATIVE APPROACH**: If pip keeps failing, install packages individually:
  ```bash
  pip3 install flask flask-sqlalchemy flask-login flask-mail gunicorn
  pip3 install dash plotly dash-bootstrap-components
  pip3 install redis mysql-connector-python googlemaps
  pip3 install pandas numpy
  # Then retry full requirements: pip3 install -r requirements.txt
  ```

### Runtime Issues
- **ImportError for dash_extensions**: This is a critical dependency, ensure full requirements.txt installation
- **Database connection timeouts**: Check firewall and network connectivity
- **Geocoding quota exceeded**: Monitor Google Maps API usage
- **Memory issues**: Dash apps can be memory-intensive with large datasets

### Development Tips
- **Always check config files**: Most issues stem from missing or incorrect API keys
- **Test incrementally**: Make small changes and test each feature individually
- **Monitor logs**: Flask debug mode provides detailed error information
- **Use browser dev tools**: Dashboard interactions require JavaScript, check console for errors

## Security Notes
- **Secret keys**: Never commit actual API keys or passwords to repository
- **Database credentials**: Use environment variables in production
- **Email passwords**: Use app-specific passwords, not account passwords
- **Session security**: Flask-Login handles session management, configure SECRET_KEY properly