from flask import Blueprint, request, g, abort

from .controllers import Controllers

from ..permissions import check_permission, Permissions


def make_blueprint(db_connection_string=None):
    """Create blueprint.
    """

    controllers = Controllers(db_connection_string)
    
    # Create instance
    blueprint = Blueprint('datarecords', 'datarecords')

    # Controller Proxies
    @check_permission([Permissions.datarecordListAll, Permissions.datarecordListOwn, Permissions.datarecordListPublic])
    def query_datarecords_(kind, role=None, user=None):
        if role is Permissions.datarecordListAll:
            return controllers.query(kind, admin=True)
        if role is Permissions.datarecordListOwn: 
            return controllers.query(kind, user=user)
        else:
            return controllers.query(kind)

    @check_permission([Permissions.datarecordReadAll, Permissions.datarecordReadOwn, Permissions.datarecordReadPublic])
    def query_datarecord_(kind, id, role=None, user=None):
        if role is Permissions.datarecordReadAll:
            return controllers.query_one(kind, id, admin=True)
        if role is Permissions.datarecordReadOwn: 
            return controllers.query_one(kind, id, user=user)
        else:
            return controllers.query_one(kind, id)

    @check_permission([Permissions.datarecordEditAll, Permissions.datarecordEditOwn])
    def edit_datarecord_(kind, role=None, user=None):
        body = request.json
        if 'id' not in body:
            abort(400)
        id = body['id']
        if role is Permissions.datarecordEditAll:
            return controllers.create_or_edit(kind, id, body, user, True)
        else:
            return controllers.create_or_edit(kind, id, body, user, False)

    @check_permission([Permissions.datarecordDeleteAll, Permissions.datarecordDeleteOwn])
    def delete_datarecord_(kind, id, role=None, user=None):
        if role is Permissions.datarecordDeleteAll:
            return controllers.delete(kind, id, admin=True)
        else:
            return controllers.delete(kind, id, user=user)

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
