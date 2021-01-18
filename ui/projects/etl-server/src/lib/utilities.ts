export function snippetize(def, record) {
    let snippet: string[] = def.snippet || ['name'];
    if (!Array.isArray(snippet)) {
        snippet = [snippet];
    }
    return snippet.map(x => record[x]).join(' / ');
}
