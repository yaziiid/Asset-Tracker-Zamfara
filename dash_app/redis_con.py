import redis
import configparser
import pandas as pd
from sqlalchemy import engine_from_config
import io

config = configparser.ConfigParser()
config.read('cloud_db.ini')
redis_host = config.get('HOST_DATA', 'redisHost')
hostname = config['HOST_DATA']['hostname']
username = config['USER_DATA']['username']
password = config['USER_DATA']['password']
database = config['USER_DATA']['database']
secret_key = config['USER_DATA']['SECRET_KEY']
geocodeAPI = config['USER_DATA']['geocodeAPI']
mapboxAPI = config['USER_DATA']['mapboxAPI']



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
    raw = r.get('zamfara_customer_db')

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