import redis
import configparser
import pandas as pd
from sqlalchemy import engine_from_config
import io
import os

config = configparser.ConfigParser()
config.read('cloud_db.ini')

# Use environment variables if available (for Heroku), otherwise fall back to config files
redis_host = os.getenv('REDIS_HOST', config.get('HOST_DATA', 'redisHost'))
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
        r = redis.Redis.from_url(redis_host, decode_responses=True)
        return r
    r = redis.Redis(host=redis_host, port=6379, decode_responses=True)
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