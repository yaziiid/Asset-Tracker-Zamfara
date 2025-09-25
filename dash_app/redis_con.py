import redis
import configparser
import pandas as pd
from sqlalchemy import engine_from_config
import io
import os

config = configparser.ConfigParser()
config.read('cloud_db.ini')

# Use environment variables if available (for Heroku), otherwise fall back to config files
# Support both REDISCLOUD_URL and REDIS_URL for Redis Cloud add-on
redis_url = os.getenv('REDISCLOUD_URL') or os.getenv('REDIS_URL') or os.getenv('REDIS_HOST', config.get('HOST_DATA', 'redisHost'))

# Database configuration - support both DATABASE_URL and individual vars
database_url = os.getenv('DATABASE_URL') or os.getenv('JAWSDB_URL')
if database_url:
    # Extract individual components from DATABASE_URL if needed for legacy code
    from urllib.parse import urlparse
    parsed = urlparse(database_url)
    hostname = parsed.hostname
    username = parsed.username  
    password = parsed.password
    database = parsed.path[1:]  # Remove leading slash
else:
    # Fall back to individual environment variables or config file
    hostname = os.getenv('DB_HOSTNAME', config['HOST_DATA']['hostname'])
    username = os.getenv('DB_USERNAME', config['USER_DATA']['username'])
    password = os.getenv('DB_PASSWORD', config['USER_DATA']['password'])
    database = os.getenv('DB_NAME', config['USER_DATA']['database'])

secret_key = os.getenv('SECRET_KEY', config['USER_DATA']['SECRET_KEY'])
geocodeAPI = os.getenv('GEOCODE_API', config['USER_DATA']['geocodeAPI'])
mapboxAPI = os.getenv('MAPBOX_API', config['USER_DATA']['mapboxAPI'])



cloud = True
def redis_con(cloud):
    if cloud:
        r = redis.Redis.from_url(redis_url, decode_responses=True)
        return r
    r = redis.Redis(host=redis_url, port=6379, decode_responses=True)
    return r

r = redis_con(cloud=cloud)



#fetches data from redis cache or database if database data does not exist in cache
def fetch_data(r, username, password, hostname, database):
    try:
        raw = r.get('zamfara_customer_db')
    except:
        raw = None

    if raw == None:
        config = {'db.url': f'mysql+pymysql://{username}:{password}@{hostname}/{database}'}
        engine = engine_from_config(config, prefix='db.')
        df = pd.read_sql_table('zamfara_customers', engine)
        engine.dispose()
        raw = df.to_csv(index=False)
        r.set('zamfara_customer_db', raw)
        r.expire('zamfara_customer_db', 86400)
    
    data = pd.read_csv(io.StringIO(raw))

    return data