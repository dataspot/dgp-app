import os
import inspect
from enum import Enum
import logging

from flask import request, g, abort
from flask_jsonpify import jsonpify

from auth import Verifyer
import auth.credentials as credentials


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

    # Level Roles
    ViewerRoles = { login, pipelinesListPublic, pipelinesStatusPublic }
    MaintainerRoles = ViewerRoles | { pipelinesListOwn, pipelinesStatusOwn, pipelinesNew, pipelinesEditOwn, workbench, pipelinesDeleteOwn }
    AdminRoles = MaintainerRoles | { pipelinesListAll, pipelinesStatusAll, pipelinesEditAll, pipelinesExecute, pipelinesDeleteAll,
                                     usersList, usersNew, usersEdit, usersDelete }

    # Level Roles Mapping
    Roles = {
        Viewer: ViewerRoles,
        Maintainer: MaintainerRoles,
        Admin: AdminRoles,
    }

__verifyer = Verifyer(public_key=credentials.public_key)


def check_permission(roles):
    def decorator(func):
        def wrapper(*args, **kw):
            global __verifyer
            token = request.values.get('jwt') or request.headers.get('X-Auth')
            permissions = __verifyer.extract_permissions(token)
            logging.info('CHECK_PERMISSION required: %s, actual: %s', roles, permissions)
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
                        return jsonpify(func(*args, **kw))
            abort(403)
        return wrapper
    return decorator