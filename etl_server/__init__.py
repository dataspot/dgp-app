import os
from dgp_oauth2.models import get_user
from .users.models import Models
from .permissions import Permissions

default_level = int(os.environ.get('DGP_APP_DEFAULT_ROLE', 0))
default_level_ret = dict(level=default_level)

def get_permissions(service, userid):

    models = Models(os.environ['ETLS_DATABASE_URL'])

    if service != 'etl-server': return {'error':'unknown-service'}
   
    value = models.query_one(userid)
    if value is None or not value.get('success'):
        if default_level:
            ret = default_level_ret
        else:
            return {'error':'unknown-user-' + userid}
    else:
        ret = value.get('result', {}).get('value')
    if ret is None: return {'error': 'no-value'}

    if 'level' in ret:
        level = ret['level']
        ret['roles'] = list(Permissions.Roles.get(level, []))

    return ret
