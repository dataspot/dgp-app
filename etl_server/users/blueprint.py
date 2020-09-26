from flask import Blueprint, request, g

from .controllers import Controllers

import dgp_oauth2.credentials as credentials

from ..permissions import check_permission, Permissions


def make_blueprint(db_connection_string=None):
    """Create blueprint.
    """

    controllers = Controllers(db_connection_string)
    credentials.db_connection_string = db_connection_string
    
    # Create instance
    blueprint = Blueprint('users', 'users')

    # Controller Proxies
    @check_permission([Permissions.usersList])
    def query_users_():
        return controllers.query_users(g.permissions.get('userid'))

    @check_permission([Permissions.usersEdit, Permissions.usersNew])
    def edit_user_(role=None):
        body = request.json
        id = body['id']
        return controllers.create_or_edit_user(id, body)

    @check_permission([Permissions.usersDelete])
    def delete_user_(id):
        return controllers.delete_user(id)

    # Register routes
    blueprint.add_url_rule(
        'users', 'query_users', query_users_, methods=['GET'])
    blueprint.add_url_rule(
        'user', 'edit_user', edit_user_, methods=['POST'])
    blueprint.add_url_rule(
        'user/<id>', 'delete_user', delete_user_, methods=['DELETE'])

    # Return blueprint
    return blueprint
