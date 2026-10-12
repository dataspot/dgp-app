from sqlalchemy.ext.declarative import declarative_base

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## API KEYS
# key is the sha256 of the API key - the key itself is never stored
class ApiKey(Base, Common):
    __tablename__ = 'etl_api_keys'


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, ApiKey, connection_string)
