import dataflows as DF

def operator(name, params):
    DF.Flow(
        DF.load(params['url']),
        DF.printer()
    ).process()
