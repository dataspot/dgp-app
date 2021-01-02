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
    
    pseudoViewer = 'pseudoViewer'
    pseudoMaintainer = 'pseudoMaintainer'
    pseudoAdmin = 'pseudoAdmin'

    # Level Roles
    DataViewerRoles = { datarecordListPublic, datarecordReadPublic }
    ViewerRoles = DataViewerRoles | { login, pipelinesListPublic, pipelinesStatusPublic,
                    pseudoViewer }
    DataEditorRoles = { datarecordListOwn, datarecordReadOwn, datarecordEditOwn, datarecordNew, datarecordDeleteOwn }
    MaintainerRoles = ViewerRoles | DataEditorRoles | \
                        { pipelinesListOwn, pipelinesStatusOwn, pipelinesNew, pipelinesEditOwn, workbench,
                          filesListOwn, filesUpload, filesDownload, filesUpdateOwn, filesDeleteOwn, taxonomyRead,
                          pseudoMaintainer }
    DataAdminRoles = { datarecordListAll, datarecordReadAll, datarecordEditAll, datarecordDeleteAll }
    SuperMaintainerRoles = MaintainerRoles | { pipelinesDeleteOwn, filesListAll }
    AdminRoles = SuperMaintainerRoles | DataAdminRoles | { 
                    pipelinesListAll, pipelinesStatusAll, pipelinesEditAll, pipelinesExecute, pipelinesDeleteAll,
                    usersList, usersNew, usersEdit, usersDelete, filesUpdateAll, filesDeleteAll,
                    taxonomyNew, taxonomyEdit, taxonomyDelete,
                    pseudoAdmin }

    # Level Roles Mapping
    Roles = {
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

def check_permission(roles):
    def decorator(func):
        def wrapper(*args, **kw):
            global __verifyer
            token = request.values.get('jwt') or request.headers.get('X-Auth')
            permissions = verifyer().extract_permissions(token)
            if not (permissions is False):
                level = permissions.get('permissions', {}).get('level', 0)
                user_roles = Permissions.Roles.get(level, [])
                for role in roles:
                    if role in user_roles:
                        g.permissions = permissions
                        fargs = inspect.getargspec(func).args
                        if 'role' in fargs:
                            kw['role'] = role
                        if 'user' in fargs:
                            kw['user'] = permissions['userid']
                        return func(*args, **kw)
            abort(403)
        return wrapper
    return decorator
