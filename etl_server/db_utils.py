import os
import json
import datetime

from contextlib import contextmanager

from sqlalchemy import (
    Column, String, DateTime, types,
    create_engine, inspect
)
from sqlalchemy.orm.session import sessionmaker, Session


# ## Json as string Type
class JsonType(types.TypeDecorator):
    impl = types.Unicode

    def process_bind_param(self, value, dialect):
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value:
            return json.loads(value)
        else:
            return None

    def copy(self, **kw):
        return JsonType(self.impl.length)


class Common():
    key = Column(String(128), primary_key=True)
    value = Column(JsonType)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ModelsBase():

    def __init__(self, base, cls, connection_string):
        connection_string = connection_string or os.environ.get('DATABASE_URL')
        assert connection_string is not None,\
            "No database defined, please set your DATABASE_URL env-var"
        self._sql_engine = create_engine(connection_string)
        self._sql_session = None
        self._cls = cls
        base.metadata.create_all(self._sql_engine)

    def __delete(self):
        if self._sql_session:
            self._sql_session

    @contextmanager
    def session_scope(self):
        """Provide a transactional scope around a series of operations."""
        if self._sql_session is None:
            self._sql_session = sessionmaker(bind=self._sql_engine)
        session: Session = self._sql_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.expunge_all()
            session.close()

    @staticmethod
    def object_as_dict(obj):
        return {c.key: getattr(obj, c.key)
                for c in inspect(obj).mapper.column_attrs}

    def create_or_edit(self, key, value, edit_allowed=None, create_kw={}, update_kw={}):
        ret = dict(created=False, success=True, result=value)
        with self.session_scope() as session:
            document = session.query(self._cls)\
                .filter(self._cls.key == key).first()
            if document is None:
                document = self._cls(key=key, value=value, **create_kw)
                ret['created'] = True
                session.add(document)
            else:
                if edit_allowed is None or edit_allowed(document):
                    document.value = value
                    for k, v in update_kw.items():
                        setattr(document, k, v)
                else:
                    ret['success'] = False
        return ret

    def query_one(self, key, case_sensitive=True):
        ret = dict(success=False)
        with self.session_scope() as session:
            if case_sensitive:
                document = session.query(self._cls)\
                    .filter(self._cls.key == key).first()
            else:
                document = session.query(self._cls)\
                    .filter(self._cls.key.ilike(key)).first()
            if document is not None:
                ret['success'] = True
                ret['result'] = self.object_as_dict(document)
        return ret

    def query(self, order_by=None):
        order_by = order_by or self._cls.updated_at.desc()
        ret = dict(result=[], success=True)
        with self.session_scope() as session:
            documents = session.query(self._cls).order_by(order_by)
            for doc in documents:
                ret['result'].append(self.object_as_dict(doc))
        return ret

    def delete(self, key, delete_allowed=None):
        ret = dict(success=False)
        with self.session_scope() as session:
            document = session.query(self._cls)\
                .filter(self._cls.key == key).first()
            if document is not None:
                if not delete_allowed or delete_allowed(document):
                    ret['success'] = True
                    session.delete(document)
        return ret
