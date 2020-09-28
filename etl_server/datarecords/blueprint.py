from flask import Blueprint, request, g

from .controllers import Controllers

from ..permissions import check_permission, Permissions


def make_blueprint(db_connection_string=None):
    """Create blueprint.
    """

    controllers = Controllers(db_connection_string)
    
    # Create instance
    blueprint = Blueprint('datarecords', 'datarecords')

    # Controller Proxies
    @check_permission([Permissions.datarecordRead])
    def query_datarecords_(kind):
        return controllers.query(kind)

    @check_permission([Permissions.datarecordRead])
    def query_datarecord_(kind, id):
        return controllers.query_one(kind, id)

    @check_permission([Permissions.datarecordEdit, Permissions.datarecordNew])
    def edit_datarecord_(kind, role=None, user=None):
        body = request.json
        id = body['id']
        return controllers.create_or_edit(kind, id, body, user)

    @check_permission([Permissions.datarecordDelete])
    def delete_datarecord_(kind, id):
        return controllers.delete(kind, id)

    # Register routes
    blueprint.add_url_rule(
        'datarecords/<kind>', 'query_datarecords', query_datarecords_, methods=['GET'])
    blueprint.add_url_rule(
        'datarecord/<kind>/<id>', 'query_datarecord', query_datarecord_, methods=['GET'])
    blueprint.add_url_rule(
        'datarecord/<kind>', 'edit_datarecord', edit_datarecord_, methods=['POST'])
    blueprint.add_url_rule(
        'datarecord/<kind>/<id>', 'delete_datarecord', delete_datarecord_, methods=['DELETE'])

    # Return blueprint
    return blueprint
