# National Infrastructure Monitoring System

A comprehensive web application for monitoring and tracking national infrastructure projects across Nigeria. Built with Flask and Dash, featuring real-time data visualization, project registration, and geographic mapping capabilities.

## Recent Updates

- **Rebranded** from "Asset Tracker" to "National Infrastructure Monitoring System"
- **Removed** phone number fields from registration forms and database records for privacy compliance
- **Enhanced** environment variable support for Heroku deployment with MySQL (JawsDB) and Redis Cloud add-ons
- **Improved** deployment configuration and documentation

## Features

- **Project Registration**: Register new infrastructure projects with location data
- **Geographic Mapping**: Interactive maps with multiple style options (Streets, Satellite, Dark)
- **Data Visualization**: Real-time dashboards and data tables
- **User Management**: Secure user authentication and authorization
- **Export Capabilities**: Export project data to Excel format
- **Responsive Design**: Mobile-friendly interface with Bootstrap components

## Technology Stack

- **Backend**: Flask, SQLAlchemy, MySQL
- **Frontend**: Dash, Bootstrap, Plotly
- **Caching**: Redis
- **Authentication**: Flask-Login, Bcrypt
- **Mapping**: Google Maps API, Mapbox
- **Email**: Flask-Mail for notifications

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Asset-Tracker-Zamfara
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration values
   ```

4. **Database Setup**
   - Create a MySQL database
   - Update database credentials in `.env`
   - Initialize database tables (if migrations exist)

5. **Run the application**
   ```bash
   python main.py
   ```

## Deployment & Environment Variables

### Heroku Deployment

This application is configured for easy deployment to Heroku with automatic environment variable detection.

#### Required Heroku Config Vars:

1. **Application Configuration**
   ```bash
   WSGI_MODULE=main:app  # Flask app entrypoint (REQUIRED)
   SECRET_KEY=your-secret-key-here
   ```

2. **Database Configuration (JawsDB MySQL)**
   ```bash
   # Automatically set by JawsDB add-on:
   JAWSDB_URL=mysql://username:password@hostname:port/database
   
   # Or use standard format:
   DATABASE_URL=mysql://username:password@hostname:port/database
   ```

3. **Redis Configuration (Redis Cloud)**
   ```bash
   # Automatically set by Redis Cloud add-on:
   REDISCLOUD_URL=redis://:password@hostname:port/0
   
   # Alternative:
   REDIS_URL=redis://hostname:port
   ```

4. **API Keys**
   ```bash
   GEOCODE_API=your-google-maps-api-key
   MAPBOX_API=your-mapbox-api-key
   ```

5. **Mail Configuration (Optional)**
   ```bash
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-email-password
   ```

#### Heroku Add-ons Setup:

1. **JawsDB MySQL**: `heroku addons:create jawsdb:kitefin`
2. **Redis Cloud**: `heroku addons:create rediscloud:30`
3. **Papertrail Logging**: `heroku addons:create papertrail:choklad`

#### Deployment Commands:

```bash
# Set up Heroku remote (if not already done)
heroku git:remote -a your-app-name

# Deploy
git push heroku main

# Run database migrations (if any)
heroku run python manage.py migrate --app your-app-name

# Check logs
heroku logs --tail --app your-app-name
```

### Environment Variables Reference

| Variable | Description | Required | Default/Fallback |
|----------|-------------|----------|------------------|
| `WSGI_MODULE` | Flask app entrypoint | Yes | `main:app` |
| `DATABASE_URL` | Complete database URL | Recommended | Falls back to individual vars |
| `JAWSDB_URL` | JawsDB MySQL URL | No | Auto-set by add-on |
| `REDISCLOUD_URL` | Redis Cloud URL | Recommended | Falls back to REDIS_URL |
| `SECRET_KEY` | Flask secret key | Yes | Config file fallback |
| `GEOCODE_API` | Google Maps API key | Yes | Config file fallback |
| `MAPBOX_API` | Mapbox API key | Yes | Config file fallback |

### Logging

- **Local Development**: Logs output to console
- **Heroku Deployment**: Logs automatically captured by Papertrail add-on
- **Log Monitoring**: Access via `heroku logs --tail` or Papertrail dashboard

## Database Schema

The application uses the following main table:

### zamfara_customers
- `id` (Primary Key)
- `name` - Project/Customer name
- `address` - Full address
- `nin` - Project ID (formerly Product ID)
- `latitude` - Geographic latitude
- `longitude` - Geographic longitude  
- `state` - State location
- `date` - Registration date
- `asset_count` - Associated asset count

**Note**: Phone number field has been removed for privacy compliance.

## API Integration

### Google Maps Geocoding
- Used for address-to-coordinates conversion
- Requires `GEOCODE_API` environment variable

### Mapbox
- Provides interactive map visualization
- Multiple map styles available
- Requires `MAPBOX_API` environment variable

## Development Notes

### Code Structure
- `main.py` - Flask application setup and routes
- `dash_app/` - Dash application components
  - `__init__.py` - Main Dash app initialization
  - `enrol.py` - Registration form components
  - `callbacks.py` - Dash callbacks and interactions
  - `redis_con.py` - Redis connection and data fetching
- `templates/` - Flask HTML templates
- `static/` - Static assets (CSS, images, JS)

### Recent Changes
- **Phone Field Removal**: Eliminated phone number inputs from registration forms
- **Rebranding**: Updated all titles to "National Infrastructure Monitoring System"
- **Environment Variables**: Enhanced support for Heroku add-ons (JawsDB, Redis Cloud)
- **Security**: Improved .gitignore to prevent secret exposure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly 
5. Submit a pull request

## Security

- Never commit secrets or API keys to the repository
- Use environment variables for all sensitive configuration
- Ensure `.env` files are in `.gitignore`
- Use strong secret keys in production

## License

[Specify your license here]

## Support

For deployment issues or feature requests, please create an issue in the repository.