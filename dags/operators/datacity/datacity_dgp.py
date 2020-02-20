from dgp.core import BaseDataGenusProcessor, BaseAnalyzer, Validator, Required
from dgp.config.consts import CONFIG_JSON_PROPERTY, CONFIG_HEADER_FIELDS,\
    RESOURCE_NAME, CONFIG_FORMAT

from dataflows import Flow, add_field, delete_fields

import tabulator
import ijson


CONFIG_DATACITY_EXTRA_HEADERS = 'datacity.extra_headers'


class SharepointJson(BaseAnalyzer):

    REQUIRES = Validator(
        Required(CONFIG_FORMAT)
    )

    ROOTS = [
        'Root.Items.Item'
    ]

    def run(self):

        if (self.config.get(CONFIG_FORMAT) == 'json' and
                not self.config.get(CONFIG_JSON_PROPERTY)):
            stream = self.context.stream
            source = stream._Stream__source
            loader = stream._Stream__loader
            for root in self.ROOTS:
                try:
                    obj = next(iter(ijson.items(loader.load(source),
                                    prefix=root + '.item')))
                    fields = obj.get('Fields', {}).get('Field', [])
                    extra_fields = []
                    for field in fields:
                        extra_fields.append(field['Caption'])
                    self.config.set(CONFIG_DATACITY_EXTRA_HEADERS, extra_fields)
                    self.config.set(CONFIG_JSON_PROPERTY, root)
                    break
                except StopIteration:
                    pass
        if self.config.get(CONFIG_DATACITY_EXTRA_HEADERS):
            extra_fields = self.config.get(CONFIG_DATACITY_EXTRA_HEADERS)
            headers = self.config.get(CONFIG_HEADER_FIELDS)
            headers = list(filter(lambda x: x != 'Fields', headers))
            headers.extend(extra_fields)
            self.config.set(CONFIG_HEADER_FIELDS, headers)

    def unfurl_fields(self):
        def func(row):
            if 'Fields' in row:
                for x in row['Fields']['Field']:
                    row[x['Caption']] = x['Value']
        return func

    def flow(self):
        if self.config.get(CONFIG_DATACITY_EXTRA_HEADERS):
            return Flow(
                *[
                    add_field(f, 'string', resources=RESOURCE_NAME)
                    for f in self.config.get(CONFIG_DATACITY_EXTRA_HEADERS)
                ],
                self.unfurl_fields(),
                # delete_fields(['Fields'])
            )


class DataCityDGP(BaseDataGenusProcessor):

    def __init__(self, config, context):
        super().__init__(config, context)
        self.steps = self.init_classes([
           SharepointJson,
        ])
