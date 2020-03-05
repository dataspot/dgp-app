import os
from auth.models import get_user
from .users.models import Models
from .permissions import Permissions


def get_permissions(service, userid):

    models = Models(os.environ['ETLS_DATABASE_URL'])

    if service != 'etl-server': return {'error':'unknown-service'}
   
    value = models.query_one(userid)
    if value is None: return {'error':'unknown-user-' + email}

    ret = value.get('result', {}).get('value')
    if ret is None: return {'error': 'no-value'}

    if 'level' in ret:
        level = ret['level']
        ret['roles'] = list(Permissions.Roles.get(level, []))

    return ret
