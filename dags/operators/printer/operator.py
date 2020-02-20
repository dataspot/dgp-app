import dataflows as DF

def operator(params):
    DF.Flow(
        DF.load(params['url']),
        DF.printer()
    ).process()
