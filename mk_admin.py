import os

from auth.models import get_users, setup_engine
from etl_server.users.models import Models
from etl_server.permissions import Permissions

if __name__ == '__main__':
    setup_engine(os.environ.get('DATABASE_URL'))
    auth_users = list(get_users())
    for i, user in enumerate(auth_users):
        print(i, user['email'])
    i = input('Choose user: ')
    i = int(i)
    auth_user = auth_users[i]
    print('Chosen', auth_user['email'])

    models = Models(os.environ['ETLS_DATABASE_URL'])
    models.create_or_edit(auth_user['id'], dict(level=Permissions.Admin))