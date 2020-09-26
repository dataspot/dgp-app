import os
from flask import Blueprint, request, g, redirect

from .controllers import Controllers

import dgp_oauth2.credentials as credentials

from ..permissions import check_permission, Permissions


def make_blueprint(bucket_name, endpoint_url, aws_access_key_id, aws_secret_access_key, aws_region):
    """Create blueprint.
    """

    controllers = Controllers(bucket_name, endpoint_url, aws_access_key_id, aws_secret_access_key, aws_region)
    
    # Create instance
    blueprint = Blueprint('files', 'files')

    # Controller Proxies
    @check_permission([Permissions.filesListAll, Permissions.filesListOwn])
    def list_files_(role=None, user=None):
        if role == Permissions.filesListAll:
            return controllers.list_files()
        elif role == Permissions.filesListOwn:
            return controllers.list_files(user)

    @check_permission([Permissions.filesDownload])
    def download_file_():
        filename = request.values['filename']
        return redirect(controllers.download_file(filename), code=301)

    @check_permission([Permissions.filesUpdateAll, Permissions.filesUpdateOwn, Permissions.filesUpload])
    def upload_file_(role=None, user=None):
        filename = os.path.basename(request.values['filename'])
        file_obj = request

        if role == Permissions.filesUpdateAll:
            ret = controllers.upload_file(file_obj, filename, user, admin=True)
        elif role in [Permissions.filesUpdateOwn, Permissions.filesUpload]:
            ret = controllers.upload_file(file_obj, filename, user, admin=False)
        return ret

    @check_permission([Permissions.filesDeleteAll, Permissions.filesDeleteOwn])
    def delete_file_(role=None, user=None):
        filename = request.values['filename']
        if role == Permissions.filesDeleteAll:
            ret = controllers.delete_file(filename, user, admin=True)
        elif role == Permissions.filesDeleteOwn:
            ret = controllers.delete_file(filename, user, admin=False)
        return ret

    # Register routes
    blueprint.add_url_rule(
        'files', 'list_files', list_files_, methods=['GET'])
    blueprint.add_url_rule(
        'file', 'download_file', download_file_, methods=['GET'])
    blueprint.add_url_rule(
        'upload', 'upload_file', upload_file_, methods=['POST'])
    blueprint.add_url_rule(
        'file', 'delete_file', delete_file_, methods=['DELETE'])

    # Return blueprint
    return blueprint
