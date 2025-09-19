# Heroku Deployment Guide

This repository is configured for deployment to Heroku in two ways:

1. Connect GitHub repo to Heroku for automatic deploys from the Dashboard
2. Use GitHub Actions (deploy-heroku.yml) to deploy on pushes to `main`

## Prerequisites
- A Heroku app created in your Heroku account.
- (Optional) Heroku Postgres add-on if your app needs a database.

## Configure the runtime entrypoint (Django or Flask)

The `Procfile` uses an environment variable `WSGI_MODULE` to determine the execution entrypoint for Gunicorn.

**For this repository (Flask app):**
- Set `WSGI_MODULE=main:app` to use the Flask app in main.py

**General examples:**
- Flask example: `WSGI_MODULE=app:app` (Default behavior if not set)
- Django example: `WSGI_MODULE=myproject.wsgi:application`

Set `WSGI_MODULE` from the Heroku Dashboard under Settings → Config Vars.

**Important:** For this specific Asset Tracker Flask application, you MUST set `WSGI_MODULE=main:app` as a config var in Heroku, since the Flask app instance is defined as `app` in `main.py`.

## Option A: Connect Heroku to GitHub (Dashboard)
1. Open your Heroku app → Deploy tab → Deployment method → GitHub → Connect.
2. Search for this repository and connect it.
3. Choose branch `main` and enable automatic deploys (optional).
4. Deploy the branch.

## Option B: GitHub Actions auto-deploy
This repository includes `.github/workflows/deploy-heroku.yml` which deploys to Heroku when you push to `main`.

Set these repository secrets (Settings → Secrets and variables → Actions → New repository secret):
- `HEROKU_API_KEY` – Your Heroku API key (from Account settings).
- `HEROKU_EMAIL` – The email address of your Heroku account.
- `HEROKU_APP_NAME` – The exact Heroku app name.

Once the secrets are configured, pushes to `main` will automatically trigger a deploy.

## Database & migrations
If using Django with Postgres:
- Add the Heroku Postgres add-on from the Resources tab.
- Run migrations manually when needed:
  ```bash
  heroku run python manage.py migrate -a <your-app-name>
  ```

## Common config vars

## Configuration for this Asset Tracker Flask App

This app currently reads configuration from local `.ini` files (`cloud_db.ini` and `mailconfig.ini`). For Heroku deployment, you'll need to set these as environment variables.

**Required Heroku Config Vars:**
1. `WSGI_MODULE=main:app` (Flask app entrypoint)
2. Database configuration:
   - `DB_HOSTNAME` – Database host
   - `DB_USERNAME` – Database username  
   - `DB_PASSWORD` – Database password
   - `DB_NAME` – Database name
   - `REDIS_HOST` – Redis connection URL
3. Application secrets:
   - `SECRET_KEY` – Flask secret key
   - `GEOCODE_API` – Google Maps geocoding API key
   - `MAPBOX_API` – Mapbox API key
4. Mail configuration (if using email features):
   - `MAIL_USERNAME` – Email username
   - `MAIL_PASSWORD` – Email password

**Note:** You may need to modify the Flask app to read from environment variables instead of `.ini` files for production deployment. The current code reads from local config files which won't be available on Heroku.

**General config vars:**
- `SECRET_KEY` – (Django) secret key  
- `DEBUG` – set to `False` in production
- `ALLOWED_HOSTS` – include your `<app-name>.herokuapp.com` (Django)
- Any API keys or environment variables your app needs

## Troubleshooting
- Missing `Procfile` or incorrect `WSGI_MODULE` will cause the dyno to crash.
- Ensure Gunicorn is in `requirements.txt`.
- For Django, configure static files (e.g., WhiteNoise) and run `collectstatic` as needed.
- Check logs: `heroku logs --tail -a <your-app-name>`