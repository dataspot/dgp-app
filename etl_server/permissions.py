import os
from enum import Enum

from flask import request, g, abort
from flask_jsonpify import jsonpify

from auth import Verifyer
import auth.credentials as credentials


class Permissions(Enum):
    Viewer = 1
    Maintainer = 2
    Admin = 3

__verifyer = Verifyer(public_key=credentials.public_key)


def check_permission(level):
    def decorator(func):
        def wrapper(*args, **kw):
            global __verifyer
            token = request.values.get('jwt')
            permissions = __verifyer.extract_permissions(token)
            if not (permissions is False):
                if permissions.get('permissions', {}).get('level', 0) >= level.value:
                    g.permissions = permissions
                    return jsonpify(func(*args, **kw))
            abort(403)
        return wrapper
    return decorator
