from flask import Blueprint, request

from .controllers import Controllers


def make_blueprint(db_connection_string=None, configuration={}):  # noqa
    """Create blueprint.
    """

    controllers = Controllers(configuration=configuration,
                              connection_string=db_connection_string)

    # Create instance
    blueprint = Blueprint('etl_server', 'etl_server')

    def query_pipelines_():
        return controllers.query_pipelines()

    def configuration_():
        return controllers.configuration()

    def edit_pipeline_():
        if request.method == 'POST':
            body = request.json
            id = body.get('id')
            return controllers.create_or_edit_pipeline(id, body)
        else:
            return {}

    def query_pipeline_(id):
        return controllers.query_pipeline(id)

    def delete_pipeline_(id):
        return controllers.delete_pipeline(id)

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
