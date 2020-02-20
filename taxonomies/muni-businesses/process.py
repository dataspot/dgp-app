from dataflows import Flow, add_computed_field, delete_fields, \
    printer, set_type

from dgp.core.base_enricher import ColumnTypeTester, ColumnReplacer, \
        DatapackageJoiner, enrichments_flows, BaseEnricher
from dgp.config.consts import RESOURCE_NAME

from datacity_server.processors import MunicipalityNameToCodeEnricher, \
    FilterEmptyFields, AddressFixer, GeoCoder, StreamingDuplicateRemover


class FilterEmptyCodes(FilterEmptyFields):
    FIELDS_TO_CHECK = {
        'business-kind': None,
        'address-full': None,
        'business-name': None,
        'property-code': None
    }


def flows(config, context):
    return enrichments_flows(
        config, context,
        MunicipalityNameToCodeEnricher,
        FilterEmptyCodes,
        StreamingDuplicateRemover,
        AddressFixer,
        GeoCoder,
    )
