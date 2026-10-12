# dgp-app HTTP API reference

Every route served on port 5000 by `server.py`, checked against commit `645d2ad`. For
architecture, auth internals and pipeline execution, see [ARCHITECTURE.md](ARCHITECTURE.md).

The API-key routes and headers were added after `645d2ad`.

## Conventions

- **Auth.** `/api/*` routes read a permission token (RS256 JWT, see ARCHITECTURE §5) from
  the `X-Auth` header, or from a `jwt` query/form parameter. Without one, they accept an API key
  as `Authorization: Bearer <key>` or `X-Api-Key: <key>` (ARCHITECTURE §5.6). A request with neither is
  **Anonymous** (level 0). A token that fails verification gets a 403.
- **Roles.** "Roles" below lists the roles the decorator accepts, **in the order it tries
  them**. The first role the caller has decides the behaviour ("all", "own" or "public").
  The level column gives the lowest level that has any of the roles:
  0 Anonymous, 1 Viewer, 2 Maintainer, 3 Admin.
- **Errors.** Missing roles give `403` with Flask's HTML error page. Most domain failures
  are `200` with `{"success": false}`. Unhandled exceptions are `500` HTML.
- **Bodies.** POST bodies are JSON (`Content-Type: application/json`) unless noted.
  Responses are JSON.
- **Model rows.** List and get endpoints backed by `ModelsBase` return raw rows:
  `{key, value, created_at, updated_at, …extra columns}`. Dates are serialized as ISO-8601 by
  `CustomJSONEncoder` in `server.py`. That relies on `app.json_encoder`, which Flask 2.3
  removed; Airflow 2 currently pins Flask below that, but a Flask upgrade would switch
  dates to RFC 1123 strings.

## Pipelines (`etl_server/pipelines/blueprint.py`)

| Method | Path | Roles (in order) | Min level |
|---|---|---|---|
| GET | `/api/configuration` | `pseudoAdmin`, `login` | 1 |
| GET | `/api/pipelines` | `pipelinesListAll`, `pipelinesListOwn`, `pipelinesListPublic` | 1 |
| GET | `/api/pipeline/<id>` | `pipelinesStatusAll`, `pipelinesStatusOwn`, `pipelinesStatusPublic` | 1 |
| POST | `/api/pipeline` | `pipelinesEditAll`, `pipelinesEditOwn` | 2 |
| DELETE | `/api/pipeline/<id>` | `pipelinesDeleteAll`, `pipelinesDeleteOwn` | 3 |
| POST | `/api/pipeline/start/<id>` | `pipelinesExecute` | 3 |
| POST | `/api/pipelines/start?kind=<kind>[&all=true]` | `pipelinesExecute` | 3 |

### GET /api/configuration

Returns the contents of `dags/configuration.json` (with the default `schedules` filled in),
with `kinds` filtered to drop `admin: true` kinds unless the caller is Admin.

```json
{"result": {"kinds": [...], "schedules": [...], "features": {...}, "theme": {...}, ...}}
```

### GET /api/pipelines

- `All`: every pipeline. `Own`: pipelines that are not private, plus the caller's own.
  `Public`: pipelines that are not private.
- Each item is the stored value merged with row metadata and the latest Airflow run:

```jsonc
{"success": true, "result": [{
  "id": "…", "name": "…", "kind": "…", "schedule": "…", "description": "…",
  "params": {...}, "result": {...} /* last run stats or null */,
  "status": {"status": "success|failed|running|queued|didnt-run",
             "execution_date": "…", "start_date": "…", "end_date": "…"},
  "owner": "<userid>", "private": false,
  "created_at": "ISO-8601", "updated_at": "ISO-8601"
}]}
```

### GET /api/pipeline/&lt;id&gt;

```jsonc
{"success": true, "result": {
  /* stored value only; owner/private/created_at are NOT included here */
  "id": "…", "name": "…", "params": {...},
  "status": {"status": "…", "execution_date": "…", "start_date": "…", "end_date": "…",
             "logs": "*** STATE: … ***\n…", "table": "<table>…</table>"}
}}
```

- Private pipelines that the caller may not see return `{"success": false}`.
- An unknown id returns `success: false` for Admins and **500** for Maintainers.

### POST /api/pipeline (create or update)

Request body (the whole pipeline record; see ARCHITECTURE §6.1):

```jsonc
{
  "id": "existing-id",          // omit to create; server generates slug(name[:80] + " " + hex(time))
  "name": "Budget lines – Tel Aviv 2026",
  "kind": "dgp_kind",
  "schedule": "@daily",         // or "manual", cron, "daily", …
  "description": "Scraped by budgetkey\ndepends on: some-parent-id",
  "private": false,             // absent or not exactly false ⇒ private
  "params": {
    "dgpConfig": { "source": {"path": "https://…/file.csv", "format": "csv"},
                   "taxonomy": {"id": "muni-budgets", "columnTypes": [...]},
                   "model": {"mapping": [...]}, "...": "..." },
    "extra.metadata.municipality": "tel-aviv"
  }
}
```

Response:

```json
{"created": true, "success": true, "result": { "...the stored value, including id..." }}
```

Behaviour:

- **Replaces** the stored value (no merge). `status` is dropped from the body.
- Ownership: a new row gets `owner = caller`. Updating someone else's pipeline requires
  `pipelinesEditAll` (Admin). Otherwise the response is `{"created": false, "success": false, "result": <body>}`
  and nothing is stored.
- **The server does not validate** `kind` (admin-only kinds included), `schedule` or
  `params`. A bad `kind` only shows up when Airflow logs a DAG creation error.
- Triggers the `new` event DAG on create. Triggers `submitted` when
  `params.dgpConfig.__submit` is truthy (it is stored as `false`), even when the update was
  rejected.
- Rewrites `cached-pipelines.json`. The scheduler picks the change up on its next parse of
  `dag_fetcher.py`.

### DELETE /api/pipeline/&lt;id&gt;

Returns `{"success": true}` if the row was deleted. Triggers the `delete` event with the
old value. The Airflow DAG disappears once the cache is re-parsed; its run history stays in
the Airflow DB.

### POST /api/pipeline/start/&lt;id&gt;

Unpauses the DAG and calls `airflow.api.common.trigger_dag(id)`.
Returns `{"result": "<run_id>"}` (no `success` key). An unknown DAG id returns 500.

### POST /api/pipelines/start

Query parameters: `kind` (effectively required), and `all=true` to include pipelines whose
last run did not succeed. Triggers each matching pipeline and returns
`{"success": true, "started": <n>}`.

## Workbench proxy (`server.py` → `server_dgp.py`)

Both routes require `workbench` (level 2). They are forwarded to the aiohttp `DgpServer`
on `127.0.0.1:5001`.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/config[?uid=<uid>]` | Body: dgp config object. Writes `$BASE_PATH/<uid>/config.yaml`. Uses a new random uid unless `uid` names an existing directory. → `{"ok": true, "uid": "<hex>"}` |
| OPTIONS | `/api/config` | Returns `{}`. No auth. |
| GET | `/api/events/<uid>` | `text/event-stream`. Runs the analysis and a sample flow for the stored config. Each `data:` is JSON, except the final `close`. |

Event messages (`dgp_server/poster.py`, consumed by `ui/…/workbench.service.ts`):

| `t` | Fields | Meaning |
|---|---|---|
| `c` | `p` = full config | The analysis changed the config. The UI replaces its copy. `publish.allowed` is forced to `false`. |
| `r` | `j` stage (0 loaded, 1 transformed, 2 enriched, 3 published), `i` row index, `p` row, `e` errors, `ef` error field | Sample row |
| `n` | `j`, `i` | Row count progress |
| `d` | `j` | Stage done |
| `e` | `e` = list of `[code, message]` | Analysis errors |
| `f` | `e` = traceback | Failure |

`/configs` on the aiohttp server is not proxied, so it cannot be reached from outside.

## Users (`etl_server/users/blueprint.py`)

All Admin (level 3).

| Method | Path | Roles | Body → Response |
|---|---|---|---|
| GET | `/api/users` | `usersList` | → `{"success": true, "result": [{"key": "<userid>", "value": {...}, "created_at", "updated_at", "self": bool}]}` |
| POST | `/api/user` | `usersEdit`, `usersNew` | `{"id": "<userid>", "level": 0-3, ...}` → `{"created", "success", "result"}` |
| DELETE | `/api/user/<id>` | `usersDelete` | → `{"success": bool}` |

- `GET` merges `etl_users` rows with the dgp-oauth2 `users` table. Rows only in the auth
  table are appended as `{key, value: <auth user>}`. `value` then includes `id`,
  `provider_id`, `username`, `name`, `email`, `avatar_url` and `join_date`. If the caller's
  own userid is not in the auth table, the response is `{}`.
- `POST` stores the **entire body** as the `etl_users` value. That value later becomes
  `permissions` inside the user's tokens. `level` must be an integer (a string such as `"3"`
  maps to no roles). The `<userid>` is the auth `users.id`, i.e. `md5(email)` of the email exactly as the provider returned it.
- `DELETE` removes the user from both `etl_users` and the auth `users` table. **Tokens
  already issued keep working** (they have no expiry).

## Taxonomies (`etl_server/taxonomies/blueprint.py`)

All Admin. `taxonomyRead` is only in the Admin role set.

| Method | Path | Roles | Body → Response |
|---|---|---|---|
| GET | `/api/taxonomies` | `taxonomyRead` | → `{"success": true, "result": [rows]}` (`_common_` excluded). Row `value` = `{id, title, column_types}`. |
| GET | `/api/taxonomy/<id>` | `taxonomyRead` | → `{"success": bool, "result": row}` |
| POST | `/api/taxonomy` | `taxonomyEdit`, `taxonomyNew` | `{"id", "title", "column_types": [...]}` → `{"created", "success", "result"}` |
| DELETE | `/api/taxonomy/<id>` | `taxonomyDelete` | → `{"success": bool}` |

DB rows override `index.yaml` titles and column types in the **workbench only**. Saved
pipelines keep the column types they were built with (ARCHITECTURE §6.4). Deleting a row
that is still in `index.yaml` re-creates it from the YAML on the next workbench request.

## Data records (`etl_server/datarecords/blueprint.py`)

Generic JSON records grouped by `kind` (a `dataRecords[].name` from the configuration; the
server does not validate it). They are stored in the `datarecords` table under
`key = "<kind>::<slug(id)>"`, truncated to 128 characters.

| Method | Path | Roles (in order) | Min level |
|---|---|---|---|
| GET | `/api/datarecords/<kind>` | `datarecordListAll`, `datarecordListOwn`, `datarecordListPublic` | **0** |
| GET | `/api/datarecord/<kind>/<id>` | `datarecordReadAll`*, `datarecordReadOwn`, `datarecordReadPublic` | **0** |
| POST | `/api/datarecord/<kind>` | `datarecordEditAll`, `datarecordEditOwn` | 2 |
| DELETE | `/api/datarecord/<kind>/<id>` | `datarecordDeleteAll`, `datarecordDeleteOwn` | 2 (own) / 3 (all) |

\* `Permissions.datarecordReadAll` is the string `'datarecordReadOwn'`.

- **Every level, including requests with no token, has `datarecordListAll` and
  `datarecordReadAll`.** List and read therefore always take the "all" branch and return
  every record of that kind.
- List → `{"success": true, "result": [{"key", "value", "created_at", "updated_at", "created_by", "updated_by"}]}`.
- Read → `{"success": true, "result": row}` or `{"success": false}`.
- Write body: any JSON object with an `id`. A missing `id` gives `400`. The `id` is slugified
  and written back into the value. Maintainers have `datarecordEditAll`, so **any Maintainer
  can overwrite any record**. New rows get `created_by`; updates set `updated_by`.
- Delete: Admins delete any record; Maintainers only records they created.

## Files (`etl_server/files/blueprint.py`)

Source files in the `BUCKET_NAME` bucket. The owner is stored in the object metadata
(`ownerid`, `ownername`).

| Method | Path | Roles (in order) | Min level | Notes |
|---|---|---|---|---|
| GET | `/api/files` | `filesListAll`, `filesListOwn` | 2 | → `{"success": true, "result": [{"filename", "last_modified" (epoch s), "size", "owner_id", "owner_name"}]}`. Maintainers see only their own files. Lists the whole bucket and makes one HEAD request per object. |
| GET | `/api/file?filename=<key>` | `filesDownload` | 2 | **301** redirect to a presigned S3 GET URL. **No owner check.** |
| POST | `/api/upload?filename=<name>` | `filesUpdateAll`, `filesUpdateOwn`, `filesUpload` | 2 | Raw request body = file bytes (not multipart). The `Content-Type` is stored. Only the `basename` of `filename` is kept. Overwriting an existing object requires owning it, or Admin. → `{"success": bool}` |
| DELETE | `/api/file?filename=<key>` | `filesDeleteAll`, `filesDeleteOwn` | 2 | Owner or Admin. → `{"success": bool}` |

To use an uploaded file in a DGP pipeline, set `dgpConfig.loader.filename` to its key.

## Auth (`dgp_oauth2/blueprint.py`, mounted at `/auth/`)

No role checks. Responses go through `jsonpify`, so `?callback=fn` returns JSONP.

| Method | Path | Input | Response |
|---|---|---|---|
| GET | `/auth/check` | `next` (URL to return to), client token in the `auth-token` header or `jwt` param | Authenticated: `{"authenticated": true, "profile": {users row}}`. Otherwise: `{"authenticated": false, "providers": {"github": {"url"}, "google": {"url"}}}`. **Fake mode** (no provider keys): each provider `url` is `next?jwt=<valid fakeuser client token>`. |
| GET | `/auth/oauth_callback` | `state`, `code` (from the provider) | 302 to the stored `next`, with `?jwt=<client token>` (HS256, 14 days). |
| GET | `/auth/authorize` | `service=etl-server`, client token in the `auth-token` header or `jwt` param | `{"userid", "permissions": {...etl_users value, "roles": [...]}, "service", "token": "<RS256, no exp>"}`. With a bad or missing token: `{"permissions": {}}`. |
| POST | `/auth/update` | client token, `username` | Sets the username once. → `{"success": bool, "error"?}` |
| GET | `/auth/public-key` | — | PEM text of `PUBLIC_KEY` |
| GET | `/auth/resolve` | `username` | `{"userid": "<id>" \| null}` |
| GET | `/auth/get_profile` | `username` | `{"found": bool, "profile": {id, name, join_date, avatar_url, gravatar}}`. **Unauthenticated.** |

Getting a permission token without the UI (prefer an API key, below):

```sh
# 1. Log in through the browser once and copy localStorage.jwt (the client token, valid 14 days).
# 2. Exchange it for a permission token:
curl -s "https://app.datacity.org.il/auth/authorize?service=etl-server&jwt=$CLIENT_JWT" | jq -r .token
# 3. Use it (it does not expire):
curl -H "X-Auth: $TOKEN" https://app.datacity.org.il/api/pipelines
```

## API keys (`etl_server/api_keys/blueprint.py`)

All three routes return 403 when the request itself is authenticated with an API key, so manage
keys with a login token (`X-Auth`) or `mk_api_key.py`. See ARCHITECTURE §5.6.

| Method | Path | Roles (in order) | Min level |
|---|---|---|---|
| GET | `/api/api-keys` | `apiKeysAll` (all keys), `apiKeysOwn` (own keys) | 2 |
| POST | `/api/api-key` | `apiKeysOwn` | 2 |
| DELETE | `/api/api-key/<id>` | `apiKeysAll` (any key), `apiKeysOwn` (own keys) | 2 |

- `POST` body: `{"name": "budgetkey sync"}` →
  `{"success": true, "result": {"id", "name", "userid", "hint", "api_key"}}`. **`api_key` is
  returned only here.**
- `GET` → `{"success": true, "result": [{"id", "name", "userid", "hint", "created_at"}]}`.
- `DELETE` uses the `id` from the listing → `{"success": bool}`. It's `false` when the id doesn't exist
  or isn't yours.

```sh
KEY=$(curl -s -X POST -H "X-Auth: $TOKEN" -H 'Content-Type: application/json' \
      -d '{"name": "my script"}' https://app.datacity.org.il/api/api-key | jq -r .result.api_key)
curl -H "Authorization: Bearer $KEY" https://app.datacity.org.il/api/pipelines
```

## Static UI routes

When `features.disableWebUi` is not set, `GET` on `/`, `/logout`, `/pipelines`, `/dashboard`,
`/users`, `/files`, `/taxonomies`, `/datarecords/*`, `/dgp/*`, `/status/*` and `/edit/*`
(each also under `/<locale>/`) serves `ui/dist/ui/<locale>/index.html`. `/he[/]` and `/en[/]`
serve the localized index. Other files come from `ui/dist/ui/` as Flask static files.
