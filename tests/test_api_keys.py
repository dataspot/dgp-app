import os
import tempfile

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

# dgp_oauth2 reads its credentials from the environment on import
_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
os.environ['PRIVATE_KEY'] = _key.private_bytes(
    serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
os.environ['PUBLIC_KEY'] = _key.public_key().public_bytes(
    serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
_db = os.path.join(tempfile.mkdtemp(), 'etls.sqlite')
os.environ['ETLS_DATABASE_URL'] = os.environ['DATABASE_URL'] = 'sqlite:///' + _db

import pytest  # noqa: E402
from flask import Flask  # noqa: E402

from etl_server.api_keys.blueprint import make_blueprint  # noqa: E402
from etl_server.permissions import check_permission, Permissions  # noqa: E402
from etl_server.users.models import Models as UserModels  # noqa: E402

ADMIN, MAINTAINER, NOBODY = 'admin-user', 'maintainer-user', 'unknown-user'


@pytest.fixture(scope='module')
def client():
    users = UserModels(os.environ['ETLS_DATABASE_URL'])
    users.create_or_edit(ADMIN, dict(level=Permissions.Admin))
    users.create_or_edit(MAINTAINER, dict(level=Permissions.Maintainer))

    app = Flask(__name__)
    app.register_blueprint(make_blueprint(os.environ['ETLS_DATABASE_URL']), url_prefix='/api/')

    @check_permission([Permissions.pipelinesExecute])
    def admin_only(user=None):
        return dict(user=user)

    @check_permission([Permissions.pipelinesNew])
    def maintainer_only(user=None):
        return dict(user=user)

    app.add_url_rule('/api/admin-only', 'admin_only', admin_only)
    app.add_url_rule('/api/maintainer-only', 'maintainer_only', maintainer_only)
    return app.test_client()


def login(userid, level):
    # What /auth/authorize hands the UI
    return {'X-Auth': jwt.encode(dict(userid=userid, permissions=dict(level=level), service='etl-server'),
                                 os.environ['PRIVATE_KEY'], algorithm='RS256')}


def new_key(client, userid, level, name='test'):
    resp = client.post('/api/api-key', json=dict(name=name), headers=login(userid, level))
    assert resp.status_code == 200
    return resp.get_json()['result']


def bearer(key):
    return {'Authorization': 'Bearer ' + key}


def test_key_acts_with_its_owners_permissions(client):
    admin_key = new_key(client, ADMIN, Permissions.Admin)['api_key']
    maintainer_key = new_key(client, MAINTAINER, Permissions.Maintainer)['api_key']

    resp = client.get('/api/admin-only', headers=bearer(admin_key))
    assert resp.status_code == 200 and resp.get_json() == dict(user=ADMIN)
    assert client.get('/api/admin-only', headers={'X-Api-Key': admin_key}).status_code == 200

    assert client.get('/api/maintainer-only', headers=bearer(maintainer_key)).get_json() == dict(user=MAINTAINER)
    assert client.get('/api/admin-only', headers=bearer(maintainer_key)).status_code == 403


def test_bad_keys_are_rejected(client):
    assert client.get('/api/maintainer-only').status_code == 403
    assert client.get('/api/maintainer-only', headers=bearer('dgp_not-a-real-key')).status_code == 403
    assert client.get('/api/maintainer-only', headers=bearer('not-even-the-right-prefix')).status_code == 403


def test_key_follows_owner_level_changes(client):
    users = UserModels(os.environ['ETLS_DATABASE_URL'])
    users.create_or_edit('demoted-user', dict(level=Permissions.Admin))
    key = new_key(client, 'demoted-user', Permissions.Admin)['api_key']
    assert client.get('/api/admin-only', headers=bearer(key)).status_code == 200
    users.create_or_edit('demoted-user', dict(level=Permissions.Viewer))
    assert client.get('/api/admin-only', headers=bearer(key)).status_code == 403


def test_key_is_stored_hashed_and_listed_without_secret(client):
    created = new_key(client, MAINTAINER, Permissions.Maintainer, name='listed')
    listed = client.get('/api/api-keys', headers=login(MAINTAINER, Permissions.Maintainer)).get_json()['result']
    mine = [k for k in listed if k['id'] == created['id']]
    assert len(mine) == 1 and mine[0]['name'] == 'listed' and 'api_key' not in mine[0]
    assert all(k['userid'] == MAINTAINER for k in listed)
    assert created['api_key'] not in open(_db, 'rb').read().decode('utf-8', 'ignore')

    all_keys = client.get('/api/api-keys', headers=login(ADMIN, Permissions.Admin)).get_json()['result']
    assert {k['userid'] for k in all_keys} >= {ADMIN, MAINTAINER}


def test_delete_own_key_only(client):
    created = new_key(client, MAINTAINER, Permissions.Maintainer)
    admin_key = new_key(client, ADMIN, Permissions.Admin)

    resp = client.delete('/api/api-key/' + admin_key['id'], headers=login(MAINTAINER, Permissions.Maintainer))
    assert resp.get_json()['success'] is False
    assert client.get('/api/admin-only', headers=bearer(admin_key['api_key'])).status_code == 200

    resp = client.delete('/api/api-key/' + created['id'], headers=login(MAINTAINER, Permissions.Maintainer))
    assert resp.get_json()['success'] is True
    assert client.get('/api/maintainer-only', headers=bearer(created['api_key'])).status_code == 403


def test_keys_cannot_manage_keys(client):
    key = new_key(client, ADMIN, Permissions.Admin)
    assert client.post('/api/api-key', json=dict(name='x'), headers=bearer(key['api_key'])).status_code == 403
    assert client.get('/api/api-keys', headers=bearer(key['api_key'])).status_code == 403
    assert client.delete('/api/api-key/' + key['id'], headers=bearer(key['api_key'])).status_code == 403


def test_viewers_cannot_create_keys(client):
    resp = client.post('/api/api-key', json=dict(name='x'), headers=login('viewer', Permissions.Viewer))
    assert resp.status_code == 403
