from flask import Blueprint, request

from ..permissions import check_permission, Permissions
from .controllers import Controllers


def make_blueprint(db_connection_string=None, configuration={}):  # noqa
    """Create blueprint.
    """

    controllers = Controllers(configuration=configuration,
                              connection_string=db_connection_string)

    # Create instance
    blueprint = Blueprint('pipelines', 'pipelines')

    @check_permission([Permissions.pipelinesListAll, Permissions.pipelinesListOwn, Permissions.pipelinesListPublic])
    def query_pipelines_(role=None, user=None):
        if role == Permissions.pipelinesListAll:
            return controllers.query_pipelines()
        elif role == Permissions.pipelinesListOwn:
            return controllers.query_pipelines(user=user)
        elif role == Permissions.pipelinesListPublic:
            return controllers.query_pipelines(public=True)

    @check_permission([Permissions.pseudoAdmin, Permissions.login])
    def configuration_(role=None):
        return controllers.configuration(admin=role==Permissions.pseudoAdmin)

    @check_permission([Permissions.pipelinesEditAll, Permissions.pipelinesEditOwn])
    def edit_pipeline_(role=None, user=None):
        if request.method == 'POST':
            body = request.json
            id = body.get('id')
            return controllers.create_or_edit_pipeline(id, body, user, role == Permissions.pipelinesEditAll)
        else:
            return {}

    @check_permission([Permissions.pipelinesStatusAll, Permissions.pipelinesStatusOwn, Permissions.pipelinesStatusPublic])
    def query_pipeline_(id, role=None, user=None):
        if role == Permissions.pipelinesStatusAll:
            return controllers.query_pipeline(id)
        elif role == Permissions.pipelinesStatusOwn:
            return controllers.query_pipeline(id, user=user)
        elif role == Permissions.pipelinesStatusPublic:
            return controllers.query_pipeline(id, public=True)

    @check_permission([Permissions.pipelinesDeleteAll, Permissions.pipelinesDeleteOwn])
    def delete_pipeline_(id, role=None, user=None):
        if role == Permissions.pipelinesDeleteAll:
            return controllers.delete_pipeline(id)
        elif role == Permissions.pipelinesDeleteOwn:
            return controllers.delete_pipeline(id, user=user)


    @check_permission([Permissions.pipelinesExecute])
    def start_pipeline_(id):
        return controllers.start_pipeline(id)

    # Register routes
    blueprint.add_url_rule(
        'pipelines', 'query_pipelines', query_pipelines_, methods=['GET'])
    blueprint.add_url_rule(
        'pipeline', 'edit_pipeline', edit_pipeline_, methods=['POST'])
    blueprint.add_url_rule(
        'pipeline/<id>', 'query_pipeline', query_pipeline_, methods=['GET'])
    blueprint.add_url_rule(
        'pipeline/start/<id>', 'start_pipeline', start_pipeline_, methods=['POST'])
    blueprint.add_url_rule(
        'pipeline/<id>', 'delete_pipeline', delete_pipeline_, methods=['DELETE'])
    blueprint.add_url_rule(
        'configuration', 'configuration', configuration_, methods=['GET'])

    # Return blueprint
    return blueprint
