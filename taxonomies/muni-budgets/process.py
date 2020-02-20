from pathlib import Path

from dataflows import Flow, add_computed_field, delete_fields, \
    printer, set_type

from dgp.core.base_enricher import ColumnTypeTester, ColumnReplacer, \
        DatapackageJoiner, enrichments_flows, BaseEnricher
from dgp.config.consts import RESOURCE_NAME

from datacity_server.processors import MunicipalityNameToCodeEnricher, FilterEmptyFields


class FilterEmptyCodes(FilterEmptyFields):

    FIELDS_TO_CHECK = {
        'card-code': lambda v: len(v) >= 10
    }

    def postflow(self):
        return Flow(self.work())


class HandleThousandsValues(ColumnReplacer):

    REQUIRED_COLUMN_TYPES = ['value-thousands']
    PROHIBITED_COLUMN_TYPES = ['value']

    def operate_on_row(self, row):
        row['value'] = (row['value-thousands'] * 1000
                        if row.get('value-thousands') is not None
                        else None)


class RecombineCardCode(ColumnReplacer):

    REQUIRED_COLUMN_TYPES = ['card:code:part1', 'card:code:part2', 'card:code:part3']
    PROHIBITED_COLUMN_TYPES = ['card:code']

    def operate_on_row(self, row):
        codes = [row[x.replace(':', '-')] for x in self.REQUIRED_COLUMN_TYPES]
        row['card-code'] = ''.join(x if x is not None else '' for x in codes)


class CardFunctionalCodeSplitter(ColumnTypeTester):

    REQUIRED_COLUMN_TYPES = ['card:code']
    PROHIBITED_COLUMN_TYPES = [f'functional-classification:moin:level{i}:code' for i in range(1, 5)]

    def conditional(self):

        new_fields = [x.replace(':', '-') for x in self.PROHIBITED_COLUMN_TYPES]

        def split_code(rows):
            if rows.res.name != RESOURCE_NAME:
                yield from rows
            else:
                for row in rows:
                    code = row['card-code'].replace('.', '')
                    for i, f in enumerate(new_fields):
                        row[f] = code[1:i+2]
                    yield row

        return Flow(
            add_computed_field([dict(
                    target=f,
                    operation='constant',
                ) for f in new_fields],
                resources=RESOURCE_NAME),
            split_code,
            *[
                set_type(
                    f, columnType=ct, resources=RESOURCE_NAME
                )
                for (f, ct) in zip(new_fields, self.PROHIBITED_COLUMN_TYPES)
            ],
        )


class CardEconomicCodeSplitter(ColumnTypeTester):

    REQUIRED_COLUMN_TYPES = ['card:code']
    PROHIBITED_COLUMN_TYPES = [f'economic-classification:moin:level{i}:code' for i in range(1, 4)]

    def conditional(self):

        new_fields = [x.replace(':', '-') for x in self.PROHIBITED_COLUMN_TYPES]

        def split_code(rows):
            if rows.res.name != RESOURCE_NAME:
                yield from rows
            else:
                for row in rows:
                    for i, f in enumerate(new_fields):
                        row[f] = row['card-code'][-3:][:i+1]
                    yield row

        return Flow(
            add_computed_field([dict(
                    target=f,
                    operation='constant',
                ) for f in new_fields],
                resources=RESOURCE_NAME),
            split_code,
            *[
                set_type(
                    f, columnType=ct, resources=RESOURCE_NAME
                )
                for (f, ct) in zip(new_fields, self.PROHIBITED_COLUMN_TYPES)
            ],
        )


class CardCodeToOfficialCardName(DatapackageJoiner):

    REQUIRED_COLUMN_TYPES = []

    REF_KEY_FIELDS = ['CODE']
    REF_FETCH_FIELDS = ['NAME']


class CardFCodeToOfficialCardName(CardCodeToOfficialCardName):

    REF_DATAPACKAGE = Path(__file__).resolve().with_name('chapters').joinpath('datapackage.json').as_posix()


class CardECodeToOfficialCardName(CardCodeToOfficialCardName):

    REF_DATAPACKAGE = Path(__file__).resolve().with_name('types').joinpath('datapackage.json').as_posix()
    REF_KEY_FIELDS = ['CODE', 'DIRECTION']


class CardCode1ToDirection(CardFCodeToOfficialCardName):

    REF_FETCH_FIELDS = ['DIRECTION']
    PROHIBITED_COLUMN_TYPES = ['direction:code']
    SOURCE_KEY_FIELDS = ['functional-classification-moin-level1-code']
    TARGET_FIELD_COLUMNTYPES = ['direction:code']


class CardCode1ToOfficialCardName(CardFCodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['functional-classification:moin:level1:name']
    SOURCE_KEY_FIELDS = ['functional-classification-moin-level1-code']
    TARGET_FIELD_COLUMNTYPES = ['functional-classification:moin:level1:name']


class CardCode2ToOfficialCardName(CardFCodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['functional-classification:moin:level2:name']
    SOURCE_KEY_FIELDS = ['functional-classification-moin-level2-code']
    TARGET_FIELD_COLUMNTYPES = ['functional-classification:moin:level2:name']


class CardCode3ToOfficialCardName(CardFCodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['functional-classification:moin:level3:name']
    SOURCE_KEY_FIELDS = ['functional-classification-moin-level3-code']
    TARGET_FIELD_COLUMNTYPES = ['functional-classification:moin:level3:name']


class CardCode4ToOfficialCardName(CardFCodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['functional-classification:moin:level4:name']
    SOURCE_KEY_FIELDS = ['functional-classification-moin-level4-code']
    TARGET_FIELD_COLUMNTYPES = ['functional-classification:moin:level4:name']


class CardECode1ToOfficialCardName(CardECodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['economic-classification:moin:level1:name']
    SOURCE_KEY_FIELDS = ['economic-classification-moin-level1-code', 'direction-code']
    TARGET_FIELD_COLUMNTYPES = ['economic-classification:moin:level1:name']


class CardECode2ToOfficialCardName(CardECodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['economic-classification:moin:level2:name']
    SOURCE_KEY_FIELDS = ['economic-classification-moin-level2-code', 'direction-code']
    TARGET_FIELD_COLUMNTYPES = ['economic-classification:moin:level2:name']


class CardECode3ToOfficialCardName(CardECodeToOfficialCardName):

    PROHIBITED_COLUMN_TYPES = ['economic-classification:moin:level3:name']
    SOURCE_KEY_FIELDS = ['economic-classification-moin-level3-code', 'direction-code']
    TARGET_FIELD_COLUMNTYPES = ['economic-classification:moin:level3:name']


def flows(config, context):
    return enrichments_flows(
        config, context,
        MunicipalityNameToCodeEnricher,
        HandleThousandsValues,
        RecombineCardCode,
        FilterEmptyCodes,
        CardFunctionalCodeSplitter,
        CardEconomicCodeSplitter,
        CardCode1ToDirection,
        CardCode1ToOfficialCardName,
        CardCode2ToOfficialCardName,
        CardCode3ToOfficialCardName,
        CardCode4ToOfficialCardName,
        CardECode1ToOfficialCardName,
        CardECode2ToOfficialCardName,
        CardECode3ToOfficialCardName,
    )
