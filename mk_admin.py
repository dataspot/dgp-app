import os

from dgp_oauth2.models import Models as AuthModels
from etl_server.users.models import Models
from etl_server.permissions import Permissions

if __name__ == '__main__':
    authModels = AuthModels(os.environ.get('DATABASE_URL'))
    auth_users = list(authModels.get_users())
    for i, user in enumerate(auth_users):
        print(i, user['email'])
    i = input('Choose user: ')
    i = int(i)
    auth_user = auth_users[i]
    print('Chosen', auth_user['email'])

    models = Models(os.environ['ETLS_DATABASE_URL'])
    models.create_or_edit(auth_user['id'], dict(level=Permissions.Admin))