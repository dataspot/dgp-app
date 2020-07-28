import json

class Cache():

    CACHED_PIPELINES_FILENAME = 'cached-pipelines.json'

    @classmethod
    def refresh_cached_pipelines(cls, models):
        return json.dump(models.all_pipelines(), open(cls.CACHED_PIPELINES_FILENAME, 'w'))

    @classmethod
    def cached_pipelines(cls):
        try:
            return json.load(open(cls.CACHED_PIPELINES_FILENAME))
        except:
            return []
    