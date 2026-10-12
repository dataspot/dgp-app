import os

from dgp_oauth2.models import Models as AuthModels
from etl_server.api_keys.controllers import Controllers

if __name__ == '__main__':
    authModels = AuthModels(os.environ.get('DATABASE_URL'))
    auth_users = list(authModels.get_users())
    for i, user in enumerate(auth_users):
        print(i, user['email'])
    i = input('Choose user (the key gets this user\'s permissions): ')
    i = int(i)
    auth_user = auth_users[i]
    print('Chosen', auth_user['email'])
    name = input('Key name: ')

    controllers = Controllers(os.environ['ETLS_DATABASE_URL'])
    ret = controllers.create(auth_user['id'], name)
    print('API key (shown only once):', ret['result']['api_key'])
