# Zamfara Asset Tracker

A comprehensive asset tracking system for Zamfara State, built with Flask and Dash.

## Features

### Data Management
- Customer registration and enrollment
- Asset tracking with GPS coordinates
- Real-time data visualization on interactive maps
- Comprehensive data filtering and search capabilities

### Enhanced Data Export (New!)
The application now provides multiple options for downloading and cloning complete data sets:

#### Download Options
1. **CSV Download** - Plain text format, compatible with Excel and other spreadsheet applications
2. **Excel Download** - Native Excel format with professional formatting and auto-adjusted column widths
3. **JSON Download** - Structured data format with metadata for programmatic use and API integration

#### Features
- **Complete Data Export**: Download the entire dataset, not just filtered/visible data
- **Timestamped Files**: Each download includes a timestamp in the filename for easy organization
- **Multiple Formats**: Choose the format that best suits your needs
- **Metadata Included**: JSON exports include export metadata for tracking and validation
- **Professional Formatting**: Excel exports include header styling and optimized column widths

### Original DataTable Export
The existing DataTable export functionality remains available for exporting filtered, sorted, or paginated data views.

## Technical Implementation

### Backend
- **Flask**: Web framework for authentication and routing
- **Dash**: Interactive dashboard framework
- **MySQL**: Database for data persistence
- **Redis**: Caching layer for improved performance
- **Google Maps API**: Geocoding and mapping services

### Frontend
- **Dash Bootstrap Components**: Responsive UI components
- **Plotly**: Interactive charts and maps
- **Font Awesome**: Professional icons
- **Bootstrap**: Responsive design framework

## Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure database settings in `cloud_db.ini`

3. Configure email settings in `mailconfig.ini`

4. Run the application:
   ```bash
   python main.py
   ```

## Usage

1. **Registration**: Create an account and verify your email
2. **Login**: Access the dashboard with your credentials
3. **Data Entry**: Use the enrollment form to add new customers/assets
4. **Visualization**: View data on the interactive map
5. **Export**: Use the download buttons to export complete datasets in your preferred format

## File Structure

```
├── main.py                 # Flask application entry point
├── dash_app/
│   ├── __init__.py        # Dash app initialization
│   ├── callbacks.py       # Dash callbacks and interactions
│   ├── records.py         # Data table and download functionality
│   ├── home.py           # Map visualization
│   ├── enrol.py          # Customer enrollment form
│   └── redis_con.py      # Redis connection and data fetching
├── templates/             # HTML templates
├── static/               # CSS and static assets
└── requirements.txt      # Python dependencies
```

## Download Feature Implementation

The enhanced download functionality is implemented across two main files:

- `dash_app/records.py`: Contains the UI components for download buttons and data preparation
- `dash_app/callbacks.py`: Implements the download callbacks and file generation logic

Each download format is optimized for its intended use case:
- CSV for data analysis and spreadsheet import
- Excel for professional reporting with formatting
- JSON for programmatic access and API integration