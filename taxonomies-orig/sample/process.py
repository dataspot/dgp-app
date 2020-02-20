from dataflows import Flow, add_computed_field, delete_fields, \
    printer, set_type

from dgp.core.base_enricher import ColumnTypeTester, ColumnReplacer, \
        DatapackageJoiner, enrichments_flows, BaseEnricher
from dgp.config.consts import RESOURCE_NAME


def flows(config, context):
    return enrichments_flows(
        config, context,
    )
