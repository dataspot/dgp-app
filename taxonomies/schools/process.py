from dgp.core.base_enricher import enrichments_flows

from datacity_server.processors import \
    FilterEmptyFields, AddressFixer, GeoCoder, GeoProjection


class FilterEmptyCodes(FilterEmptyFields):
    FIELDS_TO_CHECK = {
        'school-symbol': None,
    }


def flows(config, context):
    return enrichments_flows(
        config, context,
        FilterEmptyCodes,
        AddressFixer,
        GeoCoder,
        GeoProjection,
    )
