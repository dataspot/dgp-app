
import geocoder
import requests
import pyproj
import os

from dataflows import Flow, add_field
from dgp.core.base_enricher import BaseEnricher, ColumnTypeTester
from dgp.config.consts import RESOURCE_NAME


class AddressFixer(BaseEnricher):

    def test(self):
        return True

    def combine_addresses(self, row):
        addresses = [
            str(row[field])
            for field in
            ('address-' + suffix
             for suffix in ('full', 'street', 'house-number', 'city'))
            if field in row and row.get(field)
        ]
        if len(addresses) > 0:
            row['address-full'] = ' '.join(addresses)
        return row

    def address_fixer(self):
        def func(package):
            address_fields = [
                f['name'].replace('address-', '')
                for f in package.pkg.descriptor['resources'][-1]['schema']['fields']
                if f['name'].startswith('address-')
            ]
            if len(address_fields) > 0 and 'full' not in address_fields:
                package.pkg.descriptor['resources'][-1]['schema']['fields'].append(dict(
                    name='address-full',
                    columnType='address:full',
                    type='string'
                ))
            yield package.pkg
            for i, res in enumerate(package):
                if i == len(package.pkg.resources) - 1:
                    yield (self.combine_addresses(r) for r in res)
                else:
                    yield res
        return func

    def postflow(self):
        return Flow(
            self.address_fixer(),
        )


class GeoCoder(ColumnTypeTester):

    REQUIRED_COLUMN_TYPES = ['address:full']
    PROHIBITED_COLUMN_TYPES = ['location:lat', 'location:lon']

    def geocode(self):
        session = requests.Session()
        cache = {}
        api_key = os.environ.get('GOOGLE_MAPS_API_KEY')

        def func(row):
            address = row.get('address-full')
            if address and address.strip():
                address = address.strip()
                for prefix in ('שד', 'רח', 'רחוב'):
                    if address.startswith(prefix + ' '):
                        address = address[len(prefix)+1:]
                        break
                if address in cache:
                    result = cache[address]
                else:
                    result = None
                    if api_key:
                        g = geocoder.google(address, session=session, key=api_key, language='he')
                    else:
                        g = geocoder.osm(address, session=session, url='https://geocode.datacity.org.il/', language='he')
                    if g.ok and g.lat and g.lng:
                        result = (g.lat, g.lng)
                    cache[address] = result
                if result:
                    row['location-lat'], row['location-lon'] = result

        return func

    def conditional(self):
        return Flow(
            add_field('location-lat', 'number',
                      resources=RESOURCE_NAME, columnType='location:lat'),
            add_field('location-lon', 'number',
                      resources=RESOURCE_NAME, columnType='location:lon'),
            self.geocode()
        )


class GeoProjection(ColumnTypeTester):

    REQUIRED_COLUMN_TYPES = ['location:lat:ilgrid', 'location:lon:ilgrid']
    PROHIBITED_COLUMN_TYPES = ['location:lat', 'location:lon']
    CRS = '+ellps=GRS80 +k=1.00007 +lat_0=31.73439361111111 +lon_0=35.20451694444445 +no_defs +proj=tmerc +units=m +x_0=219529.584 +y_0=626907.39'

    def project(self):
        projector = pyproj.Proj(self.CRS)

        def func(row):
            lat, lon = row.get('location-lat-ilgrid'), row.get('location-lon-ilgrid')
            if lat and lon:
                lon, lat = projector(lon, lat, inverse=True)
                row['location-lat'] = lat
                row['location-lon'] = lon
        return func

    def conditional(self):
        return Flow(
            add_field('location-lat', 'number',
                      resources=RESOURCE_NAME, columnType='location:lat'),
            add_field('location-lon', 'number',
                      resources=RESOURCE_NAME, columnType='location:lon'),
            self.project()
        )
