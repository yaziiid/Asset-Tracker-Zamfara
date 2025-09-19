# Asset Tracker Zamfara - GitHub Copilot Instructions

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Overview
Asset Tracker Zamfara is a Flask-based web application with Dash components for asset tracking and management in Zamfara state. The application includes user authentication, MySQL database integration, Redis caching, interactive mapping with Mapbox, and email functionality.

## Working Effectively

### Dependencies and Environment Setup
- **Python Version**: Requires Python 3.10.4 (specified in runtime.txt)
- **NEVER CANCEL**: Initial dependency installation takes 5-10 minutes. Set timeout to 60+ minutes.
- Install system packages first: `sudo apt update && sudo apt install -y python3-flask python3-sqlalchemy python3-bcrypt python3-redis python3-pandas python3-requests`
- Install Python packages: `python3 -m pip install flask-sqlalchemy flask-login flask-mail flask-bcrypt flask-wtf gunicorn PyMySQL dash plotly dash-bootstrap-components dash-extensions pytz googlemaps configparser --timeout 60`
- **CRITICAL**: Network timeouts are common. Retry individual package installations if bulk install fails.

### Configuration Files
- **cloud_db.ini**: Contains MySQL database credentials, Redis connection, and API keys (geocodeAPI, mapboxAPI)
- **mailconfig.ini**: Contains Gmail SMTP credentials for email functionality
- **IMPORTANT**: The application CANNOT start without valid database credentials as it attempts database connection during module imports

### Build and Run Process
- **Build Time**: Basic dependency installation: 5-10 minutes. NEVER CANCEL.
- **Application Startup**: 1-2 seconds with valid database connection
- **Development Server**: `python3 main.py` (requires database connection)
- **Production Server**: `gunicorn main:app` (as specified in Procfile)
- **NEVER CANCEL**: Database operations may take 30+ seconds during initialization

### Database Requirements
- **Critical**: MySQL database must be accessible at startup - the application fails immediately if database connection fails
- Uses SQLAlchemy with PyMySQL driver
- Primary table: `zamfara_customers` with fields: id, name, address, phone, nin, latitude, longitude, state, date, asset_count
- Redis cache is used for performance optimization of database queries

### Testing and Validation
- **ALWAYS** test basic Flask functionality: `python3 -c "import flask; print('Flask OK')"`
- **ALWAYS** test database connectivity before running main application
- **Core validation workflow**:
  1. Test basic imports: `python3 -c "from flask import Flask; print('Imports OK')"`
  2. Test configuration reading: `python3 -c "import configparser; c=configparser.ConfigParser(); c.read('cloud_db.ini'); print('Config OK')"`
  3. Test basic Flask app creation with SQLite: Use test database URI for development
  4. **MANUAL TESTING**: Always test user workflows - registration, login, asset enrollment after changes

### External Service Dependencies
- **MySQL Database**: Amazon RDS MySQL instance (required for startup)
- **Redis**: Redis Cloud instance for caching
- **Google Maps API**: For geocoding addresses (geocodeAPI in cloud_db.ini)
- **Mapbox API**: For map visualization (mapboxAPI in cloud_db.ini)
- **Gmail SMTP**: For user email verification and password reset

### Application Structure
- **main.py**: Flask application entry point with user authentication routes
- **dash_app/**: Dash application modules integrated with Flask
  - **__init__.py**: Dash app creation and layout
  - **callbacks.py**: Interactive callbacks for Dash components
  - **home.py**: Main dashboard with map visualization
  - **enrol.py**: Customer registration form
  - **records.py**: Customer records display
  - **redis_con.py**: Redis connection and data fetching utilities
- **templates/**: HTML templates for Flask routes (login, register, etc.)
- **static/**: Static assets (CSS, images, logos)

### Common Issues and Solutions
- **Database Connection Error**: Application fails at import if MySQL is unreachable - normal for development environments
- **Import Errors**: Install missing packages individually with `--timeout 60` flag
- **Redis Connection**: Application degrades gracefully if Redis is unavailable
- **API Key Issues**: Mapbox/Google Maps features won't work without valid API keys

### Build Validation Steps
1. **Install Dependencies**: Follow dependency installation steps above (5-10 minutes)
2. **Test Basic Imports**: Verify Flask, SQLAlchemy, Dash imports work
3. **Configuration Test**: Ensure config files exist and are readable
4. **Application Import Test**: `python3 -c "import main"` will fail with database error - this is expected
5. **Gunicorn Test**: `gunicorn main:app --bind 127.0.0.1:8000 --timeout 120` fails without database - expected

### Deployment Information
- **Procfile**: Uses `gunicorn main:app` for production deployment
- **Runtime**: Python 3.10.4 specified in runtime.txt
- **Environment**: Designed for Heroku/similar PaaS deployment
- **Required Environment Variables**: Database credentials, API keys, mail credentials

### Key Modules and Locations
- **User Authentication**: main.py (lines 47-261) - login, register, password reset
- **Database Models**: main.py (lines 80-148) - User model definition
- **Dash Integration**: dash_app/__init__.py - creates integrated Dash app
- **Map Visualization**: dash_app/home.py - main dashboard with customer locations
- **Data Caching**: dash_app/redis_con.py - Redis-based data caching layer
- **Form Handling**: dash_app/enrol.py - customer enrollment form
- **Interactive Callbacks**: dash_app/callbacks.py - real-time dashboard updates

### Performance Notes
- **NEVER CANCEL**: Redis cache refresh can take 30+ seconds
- **Database queries**: Large datasets may require 60+ second timeouts
- **Map rendering**: Initial load with many points takes 15+ seconds

## Common Commands Summary

### Install Dependencies (5-10 minutes, NEVER CANCEL)
```bash
sudo apt update && sudo apt install -y python3-flask python3-sqlalchemy python3-bcrypt python3-redis python3-pandas python3-requests
python3 -m pip install flask-sqlalchemy flask-login flask-mail flask-bcrypt flask-wtf gunicorn PyMySQL dash plotly dash-bootstrap-components dash-extensions pytz googlemaps configparser --timeout 60
```

### Test Basic Functionality
```bash
python3 -c "import flask, sqlalchemy, pandas, redis, dash; print('Core imports successful')"
```

### Run Development Server (requires database)
```bash
python3 main.py
```

### Run Production Server (requires database)
```bash
gunicorn main:app --bind 0.0.0.0:8000 --timeout 120
```

### Repository Structure Reference
```
├── main.py                 # Flask app entry point
├── Procfile               # Gunicorn deployment config
├── requirements.txt       # Python dependencies
├── runtime.txt           # Python version specification
├── cloud_db.ini          # Database and API configuration
├── mailconfig.ini        # Email configuration
├── dash_app/             # Dash application modules
│   ├── __init__.py       # Dash app creation
│   ├── callbacks.py      # Interactive callbacks
│   ├── home.py          # Main dashboard
│   ├── enrol.py         # Registration form
│   ├── records.py       # Data display
│   └── redis_con.py     # Caching utilities
├── templates/            # Flask HTML templates
└── static/              # Static assets (CSS, images)
```