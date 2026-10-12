from flask import Blueprint, request, g, abort

from .controllers import Controllers

from ..permissions import check_permission, Permissions


def make_blueprint(db_connection_string=None):
    """Create blueprint.
    """

    controllers = Controllers(db_connection_string)

    # Create instance
    blueprint = Blueprint('api_keys', 'api_keys')

    def no_api_key():
        # Keys can't be used to manage keys, so a leaked key can't mint replacements for itself
        if g.get('api_key'):
            abort(403)

    # Controller Proxies
    @check_permission([Permissions.apiKeysAll, Permissions.apiKeysOwn])
    def query_api_keys_(role=None, user=None):
        no_api_key()
        if role == Permissions.apiKeysAll:
            return controllers.query()
        return controllers.query(user)

    @check_permission([Permissions.apiKeysOwn])
    def create_api_key_(user=None):
        no_api_key()
        body = request.json or {}
        return controllers.create(user, body.get('name'))

    @check_permission([Permissions.apiKeysAll, Permissions.apiKeysOwn])
    def delete_api_key_(id, role=None, user=None):
        no_api_key()
        if role == Permissions.apiKeysAll:
            return controllers.delete(id)
        return controllers.delete(id, user)

    # Register routes
    blueprint.add_url_rule(
        'api-keys', 'query_api_keys', query_api_keys_, methods=['GET'])
    blueprint.add_url_rule(
        'api-key', 'create_api_key', create_api_key_, methods=['POST'])
    blueprint.add_url_rule(
        'api-key/<id>', 'delete_api_key', delete_api_key_, methods=['DELETE'])

    # Return blueprint
    return blueprint
