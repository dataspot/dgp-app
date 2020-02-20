import copy

from dataflows import Flow, PackageWrapper, load, dump_to_sql

from dgp.core import BaseDataGenusProcessor
from dgp.config.log import logger

from dgp.config.consts import (
    CONFIG_TAXONOMY_CT, CONFIG_TAXONOMY_ID,
    RESOURCE_NAME, 
)


class DBPreparerDGP(BaseDataGenusProcessor):

    def __init__(self, config, context, lazy_engine):
        super().__init__(config, context)
        self.lazy_engine = lazy_engine

    def fill_in_pks(self, res, pks):
        for row in res:
            for pk in pks:
                assert pk not in row, 'Found %s in %s' % (pk, row)
                row[pk] = '-'
            yield row

    def add_missing_fields(self):

        def func(package: PackageWrapper):
            cts = {}
            pks = []
            for ct in self.config.get(CONFIG_TAXONOMY_CT):
                cts[ct['name'].replace(':', '-')] = ct

            descriptor = package.pkg.descriptor
            resource_idx = None
            for idx, res in enumerate(descriptor['resources']):
                if res['name'] == RESOURCE_NAME:
                    resource_idx = idx
                    fields = res['schema']['fields']
                    for field in fields:
                        if field['name'] in cts:
                            cts.pop(field['name'])
                    logger.info('Adding missing map fields %r', list(cts.keys()))
                    cts = list(cts.values())
                    for ct in cts:
                        ct_name = ct['name'].replace(':', '-')
                        fields.append(dict(
                            name=ct_name,
                            type=ct['dataType'],
                            **ct.get('options', {})
                        ))
                        if ct.get('unique'):
                            res['schema']['primaryKey'].append(ct_name)
                            pks.append(ct_name)
            if resource_idx is not None:
                descriptor = copy.deepcopy(descriptor)
                resource = descriptor['resources'][resource_idx]
                descriptor['resources'] = [resource]
                resource['schema']['fields'].append(dict(name='_source', type='string'))
                resource['schema']['primaryKey'].append('_source')
                table_name = self.config.get(CONFIG_TAXONOMY_ID)\
                    .replace('-', '_')
                Flow(
                    load((descriptor, [[]])),
                    dump_to_sql(
                        dict([
                            (table_name, {
                                'resource-name': RESOURCE_NAME,
                                'mode': 'update'
                            })
                        ]),
                        engine=self.lazy_engine(),
                    )
                ).process()
            yield package.pkg
            for res in package:
                if res.res.name == RESOURCE_NAME:
                    yield self.fill_in_pks(res, pks)
                else:
                    yield res
        return func

    def flow(self):
        return Flow(
            self.add_missing_fields()
        )