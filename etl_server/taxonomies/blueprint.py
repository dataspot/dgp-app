from flask import Blueprint, request, g

from .controllers import Controllers

from ..permissions import check_permission, Permissions


def make_blueprint(db_connection_string=None):
    """Create blueprint.
    """

    controllers = Controllers(db_connection_string)
    
    # Create instance
    blueprint = Blueprint('taxonomies', 'taxonomies')

    # Controller Proxies
    @check_permission([Permissions.taxonomyRead])
    def query_taxonomies_():
        return controllers.query()

    @check_permission([Permissions.taxonomyRead])
    def query_taxonomy_(id):
        return controllers.models.query_one(id)

    @check_permission([Permissions.taxonomyEdit, Permissions.taxonomyNew])
    def edit_taxonomy_(role=None):
        body = request.json
        id = body['id']
        return controllers.models.create_or_edit(id, body)

    @check_permission([Permissions.taxonomyDelete])
    def delete_taxonomy_(id):
        return controllers.models.delete(id)

    # Register routes
    blueprint.add_url_rule(
        'taxonomies', 'query_taxonomies', query_taxonomies_, methods=['GET'])
    blueprint.add_url_rule(
        'taxonomy/<id>', 'query_taxonomy', query_taxonomy_, methods=['GET'])
    blueprint.add_url_rule(
        'taxonomy', 'edit_taxonomy', edit_taxonomy_, methods=['POST'])
    blueprint.add_url_rule(
        'taxonomy/<id>', 'delete_taxonomy', delete_taxonomy_, methods=['DELETE'])

    # Return blueprint
    return blueprint
