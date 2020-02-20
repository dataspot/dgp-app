import copy

from dataflows import Flow, ResourceWrapper, PackageWrapper, load, dump_to_sql
from dgp.core.base_enricher import BaseEnricher, DatapackageJoiner
from dgp.config.consts import RESOURCE_NAME, CONFIG_PRIMARY_KEY, \
    CONFIG_TAXONOMY_CT, CONFIG_TAXONOMY_ID

from .geo import AddressFixer, GeoCoder, GeoProjection  #noqa


class StreamingDuplicateRemover(BaseEnricher):

    def test(self):
        return True

    def remove_dups(self, key_field_names):
        def func(rows: ResourceWrapper):
            if rows.res.name == RESOURCE_NAME:
                keys = set()
                for row in rows:
                    key = tuple(row.get(f) for f in key_field_names)
                    if key in keys:
                        continue
                    keys.add(key)
                    yield row
            else:
                return rows
        return func

    def postflow(self):
        key_field_names = [
            ct.replace(':', '-')
            for ct in self.config.get(CONFIG_PRIMARY_KEY)
        ]
        return Flow(
            self.remove_dups(key_field_names)
        )


class MunicipalityNameToCodeEnricher(DatapackageJoiner):

    REQUIRED_COLUMN_TYPES = ['municipality:name']
    PROHIBITED_COLUMN_TYPES = ['municipality:code']
    REF_DATAPACKAGE = 'http://next.obudget.org/datapackages/' +\
        'lamas-municipal-data/datapackage.json'
    REF_KEY_FIELDS = ['name_municipality']
    REF_FETCH_FIELDS = ['symbol_municipality_2015']
    SOURCE_KEY_FIELDS = ['municipality-name']
    TARGET_FIELD_COLUMNTYPES = ['municipality:code']


class FilterEmptyFields(BaseEnricher):

    FIELDS_TO_CHECK = {}

    def __init__(self, *args):
        super().__init__(*args)
        self.fields = self.FIELDS_TO_CHECK

    def test(self):
        return True

    def verify(self, row):
        for field, validator in self.fields.items():
            if field not in row:
                continue
            if not row[field]:
                return False
            if callable(validator):
                if not validator(row[field]):
                    return False
        return True

    def work(self):
        def func(package):
            yield package.pkg
            for i, res in enumerate(package):
                if i != len(package.pkg.resources) - 1:
                    yield res
                else:
                    yield filter(self.verify, res)
        return func

    def postflow(self):
        return Flow(self.work())
