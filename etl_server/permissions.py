import os
import inspect
from enum import Enum
import logging

from flask import request, g, abort
from flask_jsonpify import jsonpify

from dgp_oauth2 import Verifyer
import dgp_oauth2.credentials as credentials


class Permissions():
    # Levels
    Anonymous = 0
    Viewer = 1
    Maintainer = 2
    Admin = 3

    # Roles
    login = 'login'
    
    pipelinesListPublic = 'pipelinesListPublic'
    pipelinesListOwn = 'pipelinesListOwn'
    pipelinesListAll = 'pipelinesListAll'

    pipelinesStatusPublic = 'pipelinesStatusPublic'
    pipelinesStatusOwn = 'pipelinesStatusOwn'
    pipelinesStatusAll = 'pipelinesStatusAll'

    pipelinesNew = 'pipelinesNew'
    pipelinesDeleteOwn = 'pipelinesDeleteOwn'
    pipelinesDeleteAll = 'pipelinesDeleteAll'

    pipelinesEditOwn = 'pipelinesEditOwn'
    pipelinesEditAll = 'pipelinesEditAll'

    workbench = 'workbench'

    pipelinesExecute = 'pipelinesExecute'

    usersList = 'usersList'
    usersNew = 'usersNew'
    usersEdit = 'usersEdit'
    usersDelete = 'usersDelete'

    filesListOwn = 'filesListOwn'
    filesListAll = 'filesListAll'
    filesDownload = 'filesDownload'
    filesUpload = 'filesUpload'
    filesUpdateOwn = 'filesUpdateOwn'
    filesUpdateAll = 'filesUpdateAll'
    filesDeleteOwn = 'filesDeleteOwn'
    filesDeleteAll = 'filesDeleteAll'

    taxonomyRead = 'taxonomyRead'
    taxonomyNew = 'taxonomyNew'
    taxonomyEdit = 'taxonomyEdit'
    taxonomyDelete = 'taxonomyDelete'

    datarecordListPublic = 'datarecordListPublic'
    datarecordListOwn = 'datarecordListOwn'
    datarecordListAll = 'datarecordListAll'
    datarecordReadPublic = 'datarecordReadPublic'
    datarecordReadOwn = 'datarecordReadOwn'
    datarecordReadAll = 'datarecordReadOwn'
    datarecordNew = 'datarecordNew'
    datarecordEditOwn = 'datarecordEditOwn'
    datarecordEditAll = 'datarecordEditAll'
    datarecordDeleteOwn = 'datarecordDeleteOwn'
    datarecordDeleteAll = 'datarecordDeleteAll'

    apiKeysOwn = 'apiKeysOwn'
    apiKeysAll = 'apiKeysAll'

    pseudoAnonymous = 'pseudoAnonymous'
    pseudoViewer = 'pseudoViewer'
    pseudoMaintainer = 'pseudoMaintainer'
    pseudoAdmin = 'pseudoAdmin'

    # Level Roles
    DataViewerRoles = { datarecordListPublic, datarecordReadPublic, datarecordReadAll, datarecordListAll }
    AnonymousRoles = DataViewerRoles | { pseudoAnonymous }
    ViewerRoles =  AnonymousRoles | { login, pipelinesListPublic, pipelinesStatusPublic,
                    pseudoViewer }
    DataEditorRoles = { datarecordListOwn, datarecordReadOwn, datarecordEditOwn, datarecordNew, datarecordDeleteOwn, datarecordEditAll, }
    MaintainerRoles = ViewerRoles | DataEditorRoles | \
                        { pipelinesListOwn, pipelinesStatusOwn, pipelinesNew, pipelinesEditOwn, workbench,
                          filesListOwn, filesUpload, filesDownload, filesUpdateOwn, filesDeleteOwn,
                          apiKeysOwn, pseudoMaintainer }
    DataAdminRoles = { datarecordDeleteAll }
    SuperMaintainerRoles = MaintainerRoles | { pipelinesDeleteOwn, filesListAll, taxonomyRead }
    AdminRoles = SuperMaintainerRoles | DataAdminRoles | { 
                    pipelinesListAll, pipelinesStatusAll, pipelinesEditAll, pipelinesExecute, pipelinesDeleteAll,
                    usersList, usersNew, usersEdit, usersDelete, filesUpdateAll, filesDeleteAll,
                    taxonomyNew, taxonomyEdit, taxonomyDelete, apiKeysAll,
                    pseudoAdmin }

    # Level Roles Mapping
    Roles = {
        Anonymous: AnonymousRoles,
        Viewer: ViewerRoles,
        Maintainer: MaintainerRoles,
        Admin: AdminRoles,
    }

__verifyer = None
def verifyer():
    global __verifyer
    if __verifyer is None:
        __verifyer = Verifyer(public_key=credentials.public_key)
    return __verifyer

__api_keys = None
def api_keys():
    global __api_keys
    if __api_keys is None:
        from .api_keys.controllers import Controllers
        __api_keys = Controllers(os.environ.get('ETLS_DATABASE_URL'))
    return __api_keys

def api_key_permissions(api_key):
    """Permissions of the user owning an API key - the same ones a login of that user gets, resolved on every request."""
    userid = api_keys().userid_for(api_key)
    if userid is None:
        return False
    from . import get_permissions
    return dict(userid=userid, permissions=get_permissions('etl-server', userid), service='etl-server')

def request_api_key():
    api_key = request.headers.get('X-Api-Key')
    authorization = request.headers.get('Authorization', '')
    if not api_key and authorization.startswith('Bearer '):
        api_key = authorization[len('Bearer '):].strip()
    return api_key

def check_permission(roles):
    def decorator(func):
        def wrapper(*args, **kw):
            global __verifyer
            token = request.values.get('jwt') or request.headers.get('X-Auth')
            api_key = None if token else request_api_key()
            permissions = dict(userid=None, permissions=dict(level=0))
            if token:
                permissions = verifyer().extract_permissions(token)
            elif api_key:
                permissions = api_key_permissions(api_key)
            g.api_key = bool(api_key)
            if not (permissions is False):
                level = permissions.get('permissions', {}).get('level', 0)            
                user_roles = Permissions.Roles.get(level, [])
                for role in roles:
                    if role in user_roles:
                        g.permissions = permissions
                        fargs = inspect.getfullargspec(func).args
                        if 'role' in fargs:
                            kw['role'] = role
                        if 'user' in fargs:
                            kw['user'] = permissions['userid']
                        return func(*args, **kw)
            abort(403)
        return wrapper
    return decorator
