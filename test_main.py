#!/usr/bin/env python3
"""Minimal main.py for testing Gunicorn without external dependencies"""

from flask import Flask, render_template_string
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-secret-key-for-development-only'

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Asset Tracker Zamfara</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <h1>Asset Tracker Zamfara - Gunicorn Test</h1>
        <p>✅ Application is running with Gunicorn</p>
        <p>Timestamp: {{ timestamp }}</p>
    </body>
    </html>
    ''', timestamp=time.time())

@app.route('/health')
def health():
    return {'status': 'healthy', 'server': 'gunicorn', 'timestamp': time.time()}

if __name__ == '__main__':
    app.run(debug=True)