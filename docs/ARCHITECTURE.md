# dgp-app: architecture and developer guide

This document is for engineers and agents who change this codebase. It describes how the
app is put together, how auth works, how pipelines run, and how the image is built and
consumed. The HTTP API is documented separately in [API.md](API.md).

Everything here was checked against the code at commit `645d2ad` (plus the dependency
sources noted below). Where behaviour lives in a sibling library, the library and file are
named so you can re-check it.

API-key authentication (§5.6) was added after `645d2ad`.

## Contents

1. [What the app is](#1-what-the-app-is)
2. [Processes and request flow](#2-processes-and-request-flow)
3. [Repository layout](#3-repository-layout)
4. [Configuration](#4-configuration)
5. [Authentication and authorization](#5-authentication-and-authorization)
6. [How pipelines run](#6-how-pipelines-run)
7. [Building and releasing](#7-building-and-releasing)
8. [Local development and testing](#8-local-development-and-testing)
9. [Known issues and security notes](#9-known-issues-and-security-notes)

---

## 1. What the app is

dgp-app is a web UI and API on top of Apache Airflow. Users define **pipelines**: JSON
records with a `kind`, a schedule and kind-specific params. Each pipeline becomes an Airflow
DAG with one task, which calls the Python operator for that kind.

The most important kind is the **DGP kind** (`"dgp": true` in the configuration, usually
named `dgp_kind`). Its pipelines are built interactively in the "workbench", a wizard
backed by the [dgp](https://pypi.org/project/dgp/) ("Data Genus Processor") library. It
loads a tabular source, maps its columns to a **taxonomy** (a target schema), and
publishes rows into a shared datasets database.

The app is a generic base image (`akariv/dgp-app`). Deployments such as
`app.datacity.org.il` build on top of it and replace the configuration, taxonomies and
operators (see [§7](#7-building-and-releasing)).

Sibling repositories this app depends on:

| Package (PyPI / npm) | Local source | Role |
|---|---|---|
| `dgp-oauth2` (≥1.2.0, currently 1.3.4) | `../../dgp-auth` | OAuth login, client and permission tokens, `/auth/*` routes, users table |
| `dgp-server` (≥0.0.95) | `../dgp-server` | aiohttp `DgpServer` behind the workbench (`/api/config`, `/api/events/*`), `publish_flow` |
| `dgp` (≥0.1.3) | `../dgp` | The DGP pipeline steps, `Config`, `TaxonomyRegistry` |
| `dgp-oauth2-ng` (npm) | `../../dgp-oauth2-ng` | Angular client for the `/auth/*` flow |

## 2. Processes and request flow

`entrypoint.sh` starts four long-running processes in one container:

```
airflow db migrate || true          # errors are ignored
airflow scheduler &                 # LocalExecutor, runs the tasks
airflow webserver -w 1 &            # port 8080, not EXPOSEd, no users are created
gunicorn ... --bind 127.0.0.1:5001 --worker-class aiohttp.GunicornWebWorker server_dgp:app &
gunicorn -w 2 -t 180 --bind 0.0.0.0:5000 server:app    # foreground; the container lives as long as this does
```

```
browser / script
     │  :5000 (only exposed port)
     ▼
server.py  (Flask, 2 gunicorn workers)
 ├── /auth/*                 dgp_oauth2 blueprint (OAuth, tokens)
 ├── /api/pipelines…         etl_server.pipelines  ──► Airflow metadata DB (trigger_dag, DagRun, logs)
 ├── /api/users…             etl_server.users
 ├── /api/taxonomies…        etl_server.taxonomies
 ├── /api/datarecords…       etl_server.datarecords
 ├── /api/files…, /api/upload etl_server.files       ──► S3-compatible bucket
 ├── /api/config (POST), /api/events/<uid>  ── proxy() ──► 127.0.0.1:5001  server_dgp.py (aiohttp DgpServer)
 └── /, /pipelines, /dgp/…   static Angular build from ui/dist/ui/<locale>/

airflow scheduler ── parses dags/dag_fetcher.py ── reads cached-pipelines.json (written by server.py)
                  └─ runs dags/operators/<kind>.operator(...) ──► DATASETS_DATABASE_URL
```

### server.py (Flask, port 5000)

- Loads `dags/configuration.json` at import time (path relative to the CWD, which is `/app`).
- Sets `os.environ['ALLOWED_SERVICES'] = 'etl-server:etl_server'` **before** importing
  `dgp_oauth2`. That makes `/auth/authorize?service=etl-server` call
  `etl_server.get_permissions()` (see [§5](#5-authentication-and-authorization)).
- Registers the five `etl_server` blueprints under `/api/` and the `dgp_oauth2` blueprint
  under `/auth/`.
- `dgp_proxy()` forwards `GET /api/events/<path>` and `POST /api/config` to
  `http://localhost:5001` after checking the `workbench` role. GETs are streamed (they are
  server-sent events). POSTs forward the request headers. `OPTIONS /api/config` returns `{}`
  without a check.
- Serves the Angular SPA for its client-side routes, unless
  `configuration.features.disableWebUi` is true. `/<locale>/…` chooses `ui/dist/ui/he` or
  `ui/dist/ui/en`. The default comes from `configuration.defaultLocale` (default `en`).
- `server_extra.extra_server_init(app)` is an empty hook that downstream images can
  overwrite to add routes.
- Sessions use the filesystem (`/tmp/sessions`) and the cache is a FileSystemCache
  (`/tmp/cache`). dgp-oauth2 ≥1.3.3 stores the OAuth `state` in this cache. `SECRET_KEY` is
  the hard-coded `'-'`.
- Importing `etl_server.pipelines.controllers` builds an Airflow `DagBag` and **unpauses
  every DAG** (`Controllers.unpause_all`) in each gunicorn worker. Startup is therefore slow
  and needs a reachable Airflow DB.

### server_dgp.py (aiohttp, 127.0.0.1:5001)

`Server` subclasses `dgp_server.blueprint.DgpServer` and is mounted at `/api/`. The
workbench uses it for live previews:

1. `POST /config[?uid=…]` writes the posted dgp config to `$BASE_PATH/<uid>/config.yaml`
   (`BASE_PATH` defaults to `/var/dgp`) and returns `{ok, uid}`.
2. `GET /events/<uid>` loads that config and runs the DGP analysis repeatedly (up to 4
   phases) until the config stops changing. It then streams SSE messages: `c` (updated
   config, with `publish.allowed` forced to false), `r`/`n`/`d` (sample rows and counts
   per stage 0–3), `e` (analysis errors) and `f` (failure traceback), followed by `close`.

What this subclass adds on top of `DgpServer`:

- `HeaderMappings.fetch` collects the `params.dgpConfig` of every saved pipeline, so header
  mappings learned in one pipeline are suggested in others.
- `ColumnTypes.internal_refresh` syncs `taxonomies/index.yaml` with the `etl_taxonomies`
  table on startup and before every events request. Taxonomies missing from the DB are
  inserted. For taxonomies already in the DB, the DB's `title` and `column_types` override
  the YAML ones **in the workbench only** (see [§6.4](#64-taxonomies-at-run-time)).
- `preload_dgps` puts `PreLoaderDGP` and `FileLoaderDGP` (`etl_server/loaders/fileloader.py`)
  first in the step list.

`DgpServer` itself (in dgp-server) connects to `ETLS_DATABASE_URL` through aiopg, and to
`DATASETS_DATABASE_URL` for publishing.

### Airflow

- The image sets `AIRFLOW__CORE__EXECUTOR=LocalExecutor` and `AIRFLOW__CORE__DAGS_FOLDER=/app/dags`,
  disables examples and catchup, and sets logging to WARN. Airflow is pinned `<3`
  (`requirements.docker.txt`).
- Its metadata DB comes from `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN` (or the older
  `AIRFLOW__CORE__SQL_ALCHEMY_CONN`, which datacity-importer's compose file still uses).
  LocalExecutor will not work on the default SQLite DB.
- `dags/dag_fetcher.py` is the only DAG file. See [§6](#6-how-pipelines-run).
- The Airflow webserver runs, but port 8080 is not exposed and no Airflow users are
  created. Treat it as unused.

### UI (`ui/`)

An Angular 16 workspace with two projects:

- `projects/etl-server`: the library with all the screens (dashboard, pipeline list/edit/status,
  DGP workbench, files, users, taxonomies, data records). `api.service.ts` contains every
  API call; `workbench.service.ts` handles `/config` + `/events` over SSE
  (`ng-event-source`, which sends the `X-Auth` header).
- `projects/ui`: a thin app that hosts the library. Environments
  (`src/environments/*.ts`) set `api_endpoint` and `auth_endpoint`. The production build
  uses `/api` and `''` (same origin). It is built for the `en` and `he` locales
  (`/en/` and `/he/` base hrefs; translations in `src/locales/messages.he.xlf`, synced with
  Transifex through `npm run i18n`).

The UI shows or hides menus by role (`roles.service.ts`). This is cosmetic only: the server
enforces roles separately, and not always the same way (see [§9](#9-known-issues-and-security-notes)).

### Databases

`db/10-create-dbs.sql` creates four databases. They can be one database or separate ones;
each is chosen by its own env var:

| Env var | Contents |
|---|---|
| `ETLS_DATABASE_URL` | App state: `etl_pipeline`, `etl_users`, `etl_taxonomies`, `datarecords` |
| `DATABASE_URL` (or `AUTH_DATABASE_URL`) | dgp-oauth2 `users` table (login identities) |
| `DATASETS_DATABASE_URL` | Published data: one table per taxonomy |
| `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN` | Airflow metadata |

`etl_*` tables share one shape (`etl_server/db_utils.py: Common`): `key varchar(128) PK`,
`value` (JSON serialized into a unicode column, **not** jsonb), `created_at`, `updated_at`.
`etl_pipeline` adds `owner` and `private`; `datarecords` adds `created_by` and `updated_by`.
Tables are created with `create_all` when a model is first instantiated. There are no
migrations.

`db/20-readonly-user.sh` creates a `readonly`/`readonly` Postgres role with SELECT on
`datasets` (in the dev DB image only).

## 3. Repository layout

```
entrypoint.sh            container entrypoint (see §2)
server.py                Flask app (API + auth + static UI)
server_dgp.py            aiohttp DgpServer subclass (workbench backend)
server_extra.py          no-op extension hook for downstream images
mk_admin.py              interactive: promote an existing login to Admin
tester.py, dags/tester.py  run a dgp_kind pipeline's operator outside Airflow (both are stale, see §8)
trigger-all.py           back up all pipelines to pipelines-backup.json and trigger them (optionally by kind)
etl_server/
  __init__.py            get_permissions(): the ALLOWED_SERVICES hook used by dgp_oauth2
  permissions.py         Permissions levels/roles + check_permission decorator
  db_utils.py            engine cache, JsonType, ModelsBase (create_or_edit/query/delete)
  pipelines/             blueprint, controllers (Airflow integration), models, cache.py
  users/ taxonomies/ datarecords/ files/   blueprint + controllers + models each
  loaders/fileloader.py  FileLoaderDGP: fetch loader.filename from the bucket; base classes for URL preprocessors
dags/
  configuration.json     kinds, schedules, UI config (replaced downstream)
  dag_fetcher.py         builds one DAG per pipeline + event-handler DAGs
  operators/<kind>/__init__.py   operator(name, params[, pipeline]) per kind
  events/<event>_pipeline.py     handler(pipeline) per lifecycle event
taxonomies/index.yaml    taxonomy registry (replaced downstream)
db/                      dev Postgres image (akariv/dgp-app-db)
ui/                      Angular workspace (§2)
```

## 4. Configuration

### 4.1 `dags/configuration.json`

The file is loaded once at Flask startup and returned (filtered) by `GET /api/configuration`.
Restart the server after changing it. Keys read by the code:

| Key | Read by | Meaning |
|---|---|---|
| `kinds[]` | server + UI | Pipeline kinds. `name` must match a module under `dags/operators/`. `display` is the label. `fields[]` are the params form. |
| `kinds[].fields[]` | UI | `{name, display, description?, type?, options?, fields?}`. `type` is `text` (default), `boolean`, `enum` (or any field with `options`) or `section` (nested `fields`). Values are stored in `pipeline.params[name]`. A field named `extra.<dotted.path>` is also copied into `dgpConfig` at run time (see §6.2). |
| `kinds[].dgp` | UI | `true` makes the "DGP" workbench button available for the kind, and enables the Taxonomies menu. |
| `kinds[].admin` | server + UI | If true, `/api/configuration` hides the kind from non-admins. **The server does not check this when a pipeline is saved** (§9). |
| `schedules[]` | server + UI | `{name, display}`. Default: `@hourly @daily @weekly @monthly @yearly manual`. The UI only lets non-admins pick `manual`, but the server does not enforce this. |
| `dataRecords[]` | UI | Generic record types for `/api/datarecords/<name>`: `{name, display, display_plural, id, snippet, edit_component, admin?, fields[]}`. `edit_component` keys into `ConfigService.EXTRA_MAPPING`, which downstream apps provide. |
| `features` | server + UI | `disableWebUi` (server: don't serve the SPA), `forcePrivate` (true/false/absent controls the pipeline "private" selector), `titleVisible`, `titleEditable`, `dataUnpivoting` (workbench mapping step). |
| `theme` | UI | `{primary, primary_dark, secondary}` colours. |
| `dateFormats[]` | UI | Options for the workbench date-format picker. |
| `siteTitle`, `homepage`, `headerLinks[]` (`{url, display}`) | UI | Branding and navigation. |
| `taskNameDescription`, `taskDescription` | UI | HTML help text on the pipeline edit form. |
| `defaultLocale` | server | `en` or `he`. Used for un-prefixed SPA routes. |

### 4.2 `taxonomies/index.yaml`

This is the dgp `TaxonomyRegistry` index. It is loaded relative to the CWD as
`taxonomies/index.yaml`, by both `server_dgp.py` and the dgp_kind operator.

```yaml
<taxonomy-id>:                 # also becomes the datasets table name, with '-' replaced by '_'
  title: Human title
  column_types: dir/column_types.json   # [{name, title, dataType, unique?, mandatory?, options?}]
  header_mapping: dir/header_mapping.yaml   # optional: known header → column type
  processing_module: dir/process.py     # optional: flows(config, context) → enrichment steps
  publishing_module: publish.py         # optional: overrides publishing for this taxonomy
  loading_module / preloading_module:   # optional
  config:
    key-fields: [...]
    missingValues: [...]
    db-update-mode: append|update      # used only by dgp-server's default PublishFlow
_common_:                     # optional fallback for publishing/loading/... modules
  publishing_module: publish.py
```

The registry always adds an empty `_common_` taxonomy if the file doesn't define one.
`ConfigurableDGP` (dgp) uses the taxonomy's own module when there is one, and otherwise
falls back to `_common_`'s.

**This repo's index has no publishing module.** Run inside Airflow, a `dgp_kind` pipeline
from this base image analyses and transforms data but **writes nothing**. Publishing comes
from the downstream image. datacity-importer defines
`_common_.publishing_module: publish.py`, which calls `dgp_server.publish_flow` (§6.3).

### 4.3 Environment variables

Every variable read anywhere in this repo or by the libraries it calls in-process:

| Variable | Read in | Required | Purpose |
|---|---|---|---|
| `ETLS_DATABASE_URL` | server.py, server_dgp.py, etl_server/__init__.py, dag_fetcher.py, scripts | yes | App state DB (§2). |
| `DATASETS_DATABASE_URL` | server_dgp.py (DgpServer publish engine), dags/operators/dgp_kind (unused engine), downstream `taxonomies/publish.py` | yes, for publishing | Target DB for published data. |
| `DATABASE_URL` | dgp_oauth2.credentials, etl_server users/files controllers, users/models, mk_admin.py, `ModelsBase` fallback when no connection string is given | yes | dgp-oauth2 `users` table. |
| `AUTH_DATABASE_URL` | server.py only | no | If set, overrides `DATABASE_URL` **for the `/auth` blueprint only**. Users/files code still reads `DATABASE_URL`, so the two must point to the same DB. |
| `PRIVATE_KEY` | dgp_oauth2.credentials | **yes**: import fails if unset | RSA private key (PEM). Signs RS256 permission tokens. `sha256(PRIVATE_KEY)` is also the HS256 secret for client tokens and OAuth state. |
| `PUBLIC_KEY` | dgp_oauth2.credentials, etl_server.permissions | yes | RSA public key (PEM). Verifies `X-Auth` tokens. Served at `/auth/public-key`. |
| `GITHUB_KEY`, `GITHUB_SECRET` | dgp_oauth2.credentials | one provider pair | GitHub OAuth app. |
| `GOOGLE_KEY`, `GOOGLE_SECRET` | dgp_oauth2.credentials | one provider pair | Google OAuth app. **If neither pair is set, a "fake" provider logs anyone in as `fakeuser`** (§5.5). |
| `EXTERNAL_ADDRESS` | server.py → dgp_oauth2 | yes | Public origin used to build the OAuth callback URL (`<EXTERNAL_ADDRESS>/auth/oauth_callback`; `https://` is prepended when the scheme is missing). |
| `INSTALLED_EXTENSIONS` | dgp_oauth2.credentials | no | `;`-separated modules with `on_new_user` / `on_user_login` hooks. |
| `ALLOWED_SERVICES` | dgp_oauth2.credentials | — | **Overwritten** by server.py to `etl-server:etl_server`. |
| `DGP_APP_DEFAULT_ROLE` | etl_server/__init__.py | no (default 0) | Level given to logged-in users with no `etl_users` row. 0 means "unknown user" (no access). |
| `BUCKET_NAME` | server.py (files), loaders/fileloader.py | yes | S3 bucket for uploaded source files. Created (private) at startup if missing. |
| `S3_ENDPOINT_URL` | same | for non-AWS | e.g. MinIO or GCS interop. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | same | yes | Bucket credentials. |
| `AWS_REQUEST_CHECKSUM_CALCULATION`, `AWS_RESPONSE_CHECKSUM_VALIDATION` | **set** by files/controllers.py | — | Forced to `when_required` for GCS compatibility. |
| `BASE_PATH` | server_dgp.py | no (`/var/dgp`) | Directory for workbench session configs. |
| `SERVER_NAME` | server.py (`app.config.from_envvar`) | no | Path to an optional Flask config file. The name is misleading. |
| `AIRFLOW__*` | Airflow | `…SQL_ALCHEMY_CONN` yes | Standard Airflow settings. The Dockerfile sets the executor, DAG folder and logging. |

datacity-importer additionally uses `GOOGLE_MAPS_API_KEY` (geo processor), `CKAN_HOST`
and `CKAN_API_KEY` (admin-only `muni_business_kinds` operator).

## 5. Authentication and authorization

### 5.1 Identities and the two tokens

Authentication comes from the `dgp_oauth2` library (`../../dgp-auth/dgp_oauth2`).
Authorization comes from this repo. Two different JWTs are involved:

| | Client token | Permission token |
|---|---|---|
| Issued by | `/auth/oauth_callback` (via `_get_token_from_userid`) | `/auth/authorize?service=etl-server` |
| Algorithm / key | HS256, secret `sha256(PRIVATE_KEY)` | RS256, `PRIVATE_KEY` |
| Claims | `userid`, `exp` = now + 14 days | `userid`, `permissions`, `service`. **No `exp`, `iat` or `nbf`.** |
| Stored by UI | `localStorage['jwt']` | memory only. Re-fetched on every page load. |
| Sent as | `auth-token` header or `jwt` param to `/auth/*` | `X-Auth` header (or `jwt` query/form param) to `/api/*` |

The user id is `md5(email)` (`dgp_oauth2/models.py: create_or_get_user`), **not** the
provider id. The `provider:id` string is computed but stored in `users.provider_id`. Logging
in with Google and with GitHub using the same email gives the same user.

### 5.2 Login flow

1. The UI (`dgp-oauth2-ng` `AuthService.check`) calls `GET /auth/check?next=<current URL>`,
   sending the stored client token if it has one.
   - Valid token: `{authenticated: true, profile: {...users row}}`.
   - Otherwise: `{authenticated: false, providers: {github: {url}, google: {url}}}`. Each
     URL is the provider's authorize URL. A signed `{provider, next}` state (10-minute
     `exp`) is stored in the Flask cache under `state_<oauth state>`.
2. The user follows the provider URL. The provider redirects to `/auth/oauth_callback?state=…`,
   which exchanges the code, fetches the profile (for GitHub, also `/user/emails`),
   creates or updates the `users` row, and redirects to `next` with `?jwt=<client token>`
   appended.
3. The UI picks up `jwt` from the URL, saves it, and calls
   `GET /auth/authorize?service=etl-server` with it.
4. `authorize` decodes the client token, then calls `dgp_oauth2.permissions.get_token`. That
   function looks up `etl-server` in `ALLOWED_SERVICES`, imports `etl_server` and calls
   `etl_server.get_permissions('etl-server', userid)`. It returns
   `{userid, permissions, service, token}`, where `token` is the RS256 JWT of the first three.
5. The UI treats the user as authorized iff `permissions.level` is truthy (≥1). It then
   sends `token` as `X-Auth` on every API call.

### 5.3 `etl_server.get_permissions`

`etl_server/__init__.py`:

- Looks up `etl_users` by key (case-insensitive `ILIKE`, so `%`/`_` in a userid act as wildcards).
- If no row: returns `{level: DGP_APP_DEFAULT_ROLE}` when that is non-zero, otherwise
  `{'error': 'unknown-user-<id>'}`. The error result has no `level`, so the user is
  treated as Anonymous.
- If there is a row: returns the row's whole `value` (whatever an admin stored through
  `POST /api/user`). When it has `level`, it adds `roles = Permissions.Roles[level]`.

The result is **embedded in the permission token**. Changing a user's level, or deleting
the user, does not affect tokens already issued (§9).

### 5.4 Levels, roles and `check_permission`

`etl_server/permissions.py` defines four levels:

| Level | Name | Role set |
|---|---|---|
| 0 | Anonymous (also: no token) | `DataViewerRoles` + `pseudoAnonymous` |
| 1 | Viewer | + `login`, `pipelinesListPublic`, `pipelinesStatusPublic`, `pseudoViewer` |
| 2 | Maintainer | + `DataEditorRoles` + own pipelines (list/status/new/edit), `workbench`, own files (list/upload/download/update/delete) |
| 3 | Admin | + `SuperMaintainerRoles` (`pipelinesDeleteOwn`, `filesListAll`, `taxonomyRead`) + all pipelines (list/status/edit/delete/execute), users CRUD, files update/delete all, taxonomy new/edit/delete, `datarecordDeleteAll`, `pseudoAdmin` |

`SuperMaintainerRoles` is only reachable as part of Admin; no level maps to it on its own.
To print the effective sets, exec the `Permissions` class body (it needs no imports) and
print `Permissions.Roles`.

`check_permission([role, …])` wraps a view:

1. Reads the token from `request.values['jwt']` (query string or form) or the `X-Auth` header.
   If there is no token, it looks for an API key (§5.6).
2. Neither: `{userid: None, permissions: {level: 0}}`, which is Anonymous. A token that
   doesn't verify, or an unknown API key: `abort(403)`.
3. Computes the user's roles **from `permissions.level` in the token** (the `roles` list in
   the token is ignored). Then walks the decorator's role list **in order** and calls the
   view with the **first** role the user has, as `role=` (and `user=` = token `userid`)
   when the view accepts those parameters. The views branch on `role` to choose
   "all / own / public" behaviour. **The order of the list matters.**
4. No matching role: `403` (Flask's HTML error page, not JSON).

### 5.5 Gotchas

- **Fake login.** When neither `GITHUB_*` nor `GOOGLE_*` is configured, `/auth/check`
  returns provider URLs that already carry a valid client token for the built-in
  `fakeuser` (`fakey@mcfakerson.com`). This is meant for local development. On a server with
  a missing OAuth secret, anyone can log in, and with `DGP_APP_DEFAULT_ROLE>0` they get real access.
- **Permission tokens never expire** (no `exp` claim, verified in
  `dgp_oauth2/controllers.py: authorize`). Anyone who gets hold of one can use it until
  `PRIVATE_KEY`/`PUBLIC_KEY` are rotated. Rotation also invalidates every client token and
  logs everyone out.
- `/auth/authorize` and the other `/auth/*` routes use `jsonpify`, so they honour a
  `callback=` parameter (JSONP).
- `CORS(app, supports_credentials=True)` with the default origins reflects any `Origin`.
  Auth is header-based, so this does not by itself enable CSRF.
- To call the API from a script, use an API key (§5.6). Before keys existed, the only way
  was to log in through the UI, read `localStorage.jwt`, exchange it at
  `/auth/authorize?service=etl-server&jwt=…`, and send the returned non-expiring `token` as `X-Auth`.

### 5.6 API keys

Code: `etl_server/api_keys/` (models, controllers, blueprint), `check_permission` in
`etl_server/permissions.py`, `mk_api_key.py`. Tests: `tests/test_api_keys.py`.

- **Format and storage.** Keys look like `dgp_<43 url-safe chars>`. The `etl_api_keys`
  table (in `ETLS_DATABASE_URL`, standard `key`/`value` layout) is keyed by the key's
  **sha256**, so the key itself is never stored. `value` is `{id, name, userid, hint}`,
  where `id` is a random handle used for revocation and `hint` is the first 8 characters.
- **Sending one.** `Authorization: Bearer <key>` or `X-Api-Key: <key>`. These are only consulted
  when the request has no `jwt` / `X-Auth`, so a logged-in browser is unaffected.
- **Permissions.** A key acts as the user who created it. Each request resolves that user's
  current level through `etl_server.get_permissions`, the same function `/auth/authorize`
  uses. Unlike the permission token, demoting or deleting the user takes effect immediately
  (but if `DGP_APP_DEFAULT_ROLE` is non-zero, a deleted user's keys fall back to that level,
  so revoke them too).
  `user=` in views is the owner's userid, so keys own the pipelines they create.
- **Management roles.** `apiKeysOwn` (Maintainer and up) creates, lists and deletes your own keys.
  `apiKeysAll` (Admin) lists and deletes everyone's. `check_permission` sets `g.api_key`, and
  the key-management routes return 403 when it is true. A key can't create, list or revoke keys,
  so a leaked key can't mint a replacement for itself.
- **Getting the first key.** Either `POST /api/api-key` with your `X-Auth` token, or run
  `python mk_api_key.py` inside the container (same env as `mk_admin.py`). It prints the key once.
- **Cost.** Each request with a key does one indexed lookup in `etl_api_keys`, plus
  `get_permissions`, which reads `etl_users`.

## 6. How pipelines run

### 6.1 Pipeline record

Stored in `etl_pipeline` with `key = id`. The `value` is exactly the JSON the client posted,
minus `status`:

```jsonc
{
  "id": "my-pipeline-6523f1a2",     // slug of name[:80] + hex(unix time) when omitted on create
  "name": "Human name",              // also the DGP output title
  "kind": "dgp_kind",                // module dags/operators/<kind>
  "schedule": "manual",              // "@daily"/"daily"/cron (5–6 fields)/"manual"/anything else ⇒ no schedule
  "description": "free text\ndepends on: parent-pipeline-id",
  "private": false,                  // missing or anything but false ⇒ private
  "params": {                        // kind fields; for DGP kinds also:
    "dgpConfig": { ... },            // full dgp config (see below)
    "extra.metadata.foo": "bar"      // optional: copied into dgpConfig at run time
  },
  "result": { ... }                  // written by Airflow after each run (dataflows stats or null)
}
```

`owner` (the creator's userid) and `private` are separate columns. `POST /api/pipeline`
**replaces** the whole value; it does not merge. Send every field back when updating.

`dgpConfig` is the flattened-on-save dgp config the workbench builds. The main keys
(`dgp/config/consts.py`) are: `source.path` (URL or path), `source.format`,
`source.encoding`, `source.sheet`, `source.headers`; `loader.filename` (an object in
`BUCKET_NAME`, set when the source was uploaded); `structure.skip_rows`,
`structure.skip_cols`, `structure.header_count`, `structure.headers`; `taxonomy.id`,
`taxonomy.columnTypes`, `taxonomy.settings`, `taxonomy.missingValues`; `model.mapping`
(source header → column type), `model.extraFields`, `model.primary_key`; `constants`;
`publish.allowed`; `extra.metadata`; and `__submit` (UI-only: "submit for review").

There is no schema validation. For an automated source, the practical approach is to build
one pipeline in the workbench, `GET /api/pipeline/<id>`, and use its `dgpConfig` as a
template.

### 6.2 From record to DAG

`server.py` writes every pipeline to `cached-pipelines.json` in the CWD
(`etl_server/pipelines/cache.py`). It does so at startup and after each create, edit or
delete **made through the API**.
`dags/dag_fetcher.py` builds the DAGs **from that file, not from the DB**. A row written
straight to `etl_pipeline` will not become a DAG until the Flask server restarts or another
pipeline is saved.

For each pipeline, `dag_fetcher.py`:

1. Normalises `schedule`. Cron presets and 5–6 field cron strings are kept, `daily` becomes
   `@daily`, and anything else (including `manual`) becomes `None`.
2. Creates `DAG(dag_id=pipeline.id, catchup=False)` (its `start_date` is a fixed date within the past year) with one
   `PythonOperator(task_id=pipeline.id)`. That operator calls
   `operators.<kind>.operator(name, params, pipeline)`, truncated to as many arguments as
   the operator accepts.
3. If `description` contains `depends on: <id>` (case-insensitive; only `[-a-z0-9]`; the
   **last** such line wins; it must end its line), it adds an
   `ExternalTaskSensor(external_dag_id=<id>, external_task_id=<id>, mode='reschedule')`
   before the task. The sensor matches the **same logical date**, so parent and child must
   have identical schedules. A `manual` child never runs on its own.
   Otherwise, scheduled DAGs get a `LatestOnlyOperator` first.
4. Wraps the operator. In a `finally:` block it reloads the pipeline from the DB, stores
   the operator's return value in `value.result` (`null` on failure), and triggers the
   `accepted` event if this is the first truthy result.

`dag_fetcher.py` also defines:

- `_clean_scheduler_logs_dag`: hourly `rm -rf` of the scheduler child-process log folder.
- `event_handler_{new,submitted,accepted,delete,failed}_pipeline_dag`: unscheduled DAGs
  that call `dags/events/<event>_pipeline.py: handler(pipeline)`, with the pipeline passed
  as `dag_run.conf`. They are triggered from `etl_server/pipelines/controllers.py`:
  `new` on create, `submitted` when an edit carries `dgpConfig.__submit` (which is then
  reset to false), `delete` on delete, and `accepted` from the wrapper above. **`failed` is
  never triggered.** In this repo the handlers only log. Downstream images can replace them.

### 6.3 The dgp_kind operator

`dags/operators/dgp_kind/__init__.py: operator(name, params, pipeline)`:

1. Sets `dgpConfig.publish.allowed = true`.
2. Fills `dgpConfig.extra.metadata` with `title=name`, `description`, `dag_id`, `created_at`, `updated_at`.
3. Copies each `params["extra.<path>"]` into `dgpConfig` at that dotted path.
4. If `extra.metadata.disabled` is `true`, it logs and returns `None` (the run succeeds and
   the stored `result` is cleared).
5. Writes the config to a temporary YAML file, loads `TaxonomyRegistry('taxonomies/index.yaml')`,
   and runs `SimpleDGP` with these steps:

   `PreLoaderDGP → FileLoaderDGP → LoaderDGP → PostLoaderDGP → TransformDGP → EnricherDGP → PublisherDGP`

   - `FileLoaderDGP` (this repo): if `loader.filename` is set, it downloads that object from
     the bucket into `$TMPDIR/file-cache/<lastmodified>-<name>` and points `source.path` at
     the local copy.
   - `TransformDGP`/`EnricherDGP` run the taxonomy's `processing_module` flows.
   - `PublisherDGP` runs the taxonomy's (or `_common_`'s) `publishing_module`. In this repo's
     base configuration there is none, so nothing is written.
6. Fails the task (`assert False`) if analysis reports errors. Otherwise it runs the flow
   plus `dataflows.printer(tablefmt='html')` and returns the dataflows stats.

**Where results land (datacity-importer).** `_common_` publishing there runs
`MissingColumnsAdder`, `EnsureUniqueFields` and then
`dgp_server.publish_flow(config, engine=DATASETS_DATABASE_URL, mode='append', fast=True)`
(`../dgp-server/dgp_server/publish_flow.py`):

- The table name is `taxonomy.id` with `-` replaced by `_` (e.g. `muni-budgets` → `muni_budgets`).
- Every row gets `_source` = `source.path`, plus `#sheet-<n>` when `source.sheet` is set.
- `clear_by_source` creates an index `"<table>__s"` on `_source` (errors are only logged),
  then `DELETE FROM <table> WHERE _source = :source`, and then `dump_to_sql(mode='append')`.
  This makes reruns idempotent **per source value**.
- **Caveat:** when the source came from the bucket, `source.path` is the local cache path,
  which includes the object's last-modified timestamp. Re-uploading the file changes
  `_source`, so the old rows are **not** deleted. The same thing happens when an automated
  source uses a different URL for each run. Keep `source.path` stable for a given logical
  source.

### 6.4 Taxonomies at run time

At run time `publish.allowed` is true, so dgp's `TaxonomyFetcherAnalyzer` **does not
refresh** `taxonomy.columnTypes` and `taxonomy.settings`. It uses the copies saved inside
the pipeline's `dgpConfig` during its last workbench session. Changing a taxonomy (in
`index.yaml` or through `/api/taxonomy`) affects existing pipelines only after each one is
reopened in the workbench and saved. Processing and publishing modules, however, always come
from the current `taxonomies/` directory.

### 6.5 Status and logs in the UI

`GET /api/pipelines` and `GET /api/pipeline/<id>` add `status` from Airflow's
`DagRun.get_latest_runs()`: `{status, execution_date, start_date, end_date}`. A pipeline
without a run gets `status: "didnt-run"`.

The single-pipeline call also adds `logs` and `table`. It reads the Airflow task log through
the `task` `FileTaskHandler`, using the running TaskInstance if there is one, otherwise the
latest finished one. It keeps a `*** STATE … ***` header, the first 50 lines, `...`, and the
last 5000 lines. The **last** `<table>…</table>` block (the printer's HTML sample) is moved
into `table`.

Triggering: `POST /api/pipeline/start/<id>` unpauses the DAG and calls Airflow's
`trigger_dag`.

## 7. Building and releasing

### 7.1 Image

`Dockerfile`: `python:3.12-slim`, system packages, `pip install gunicorn numpy pandas dgp-server pyproj`,
`requirements.txt` + `requirements.docker.txt` (Airflow `<3`), then `ADD . .` and
`pip install -e .`. The `etl` user runs it, **with passwordless sudo** (marked `TODO: Remove`).
It exposes 5000 and starts `entrypoint.sh`.

**The Docker build does not build the UI.** `ADD . .` copies whatever is in `ui/dist/`
(`.dockerignore` excludes `ui/src` and `ui/node_modules`, not `ui/dist`). Build the UI first:

```sh
(cd ui && npm install && npm run build_lib && npm run package)   # → ui/dist/ui/{en,he}
```

### 7.2 CI and release paths

| Path | What it does |
|---|---|
| `.github/workflows/main.yml` (every push) | Node 16 UI build, then `docker build` → pushes `akariv/dgp-app:<sha>`. On `master` it also pushes `:latest`. The second job builds `db/` → `akariv/dgp-app-db` (its `<sha>` push tags the wrong local image, `server`; see §9). |
| `build_docker.sh` | Local build and push of `akariv/dgp-app:latest`. **Does not build the UI.** |
| `db/build_docker.sh` | Local build and push of `akariv/dgp-app-db:latest`. |
| `deploy_pip.sh` | `setup.py sdist bdist_wheel` + `twine upload` of the `etl-server` package (version in `etl_server/VERSION`, currently 0.0.13). `MANIFEST.in` excludes `ui/**` and `taxonomies/**`. Little else depends on this today; the image installs from source. |
| `ui` `npm run publish_lib` | Publishes the Angular library (`dist/etl-server`) to npm. |
| `.travis.sh`, `.travis.yml.bak` | Dead (Travis). |

### 7.3 Downstream images (datacity-importer)

`/Users/adam/Code/datacity/datacity-importer/Dockerfile`:

```dockerfile
FROM akariv/dgp-app:latest
RUN sudo pip install -U -r requirements.dev.txt      # relies on the base image's NOPASSWD sudo
COPY configuration.json dags/                         # replaces kinds/schedules/UI config
COPY logo.png ui/dist/ui/assets/logo.png
COPY taxonomies taxonomies                            # merges into /app/taxonomies; index.yaml replaced
COPY datacity_server datacity_server
COPY operators dags/operators/                        # adds kinds (business_licensing_law, muni_business_kinds)
ENV PYTHONPATH="/app/"
RUN pip install .
```

It is pushed as `hasadna/datacity-dgp-importer:latest` by its `build_docker.sh`. Consequences:

- Any push to dgp-app `master` changes what the next datacity build gets (`:latest` floats).
  For reproducible releases, pin `FROM akariv/dgp-app:<git sha>` (CI pushes SHA tags).
- Removing `sudo` from the base image breaks the downstream build.
- Paths that downstream images overwrite are part of the contract:
  `dags/configuration.json`, `dags/operators/`, `dags/events/`, `taxonomies/`,
  `server_extra.py`, `ui/dist/ui/assets/`.
- How `app.datacity.org.il` is deployed (orchestration and secrets) is not in either repo.

## 8. Local development and testing

### Running the stack

`docker-compose.yml` runs `db` (built from `db/`, exposed on host 55432), `minio`
(host 9000, data in `./minio-data`) and `server` (built from `.`, port 5000, with `./dags`
mounted). It includes a **development** RSA key pair and the connection strings, and reads
extra env from `creds.sh` (git-ignored; compose fails if the file is missing).

```sh
(cd ui && npm install && npm run build_lib && npm run package)
touch creds.sh                       # or put GITHUB_KEY=… / GITHUB_SECRET=… in it
docker compose up --build server     # http://localhost:5000
```

With no OAuth credentials, the login button signs you in as `fakeuser`. That user has no
level, so make it an admin:

```sh
docker compose exec server python mk_admin.py   # pick the user by number
```

For UI work, run `cd ui && npm start` (ng serve on :4200, `environment.ts` → `http://localhost:5000`).
Rebuild the library (`npm run watch_lib`) when you change `projects/etl-server`.

### Running a pipeline outside Airflow

`tester.py` and `dags/tester.py` call the dgp_kind operator directly, but **both are stale**.
They pass 2 arguments to an operator that requires 3 (`pipeline`, which needs `__updated_at`
and `__created_at`). A working equivalent, run from `/app` with `PYTHONPATH=dags`:

```python
import os
from etl_server.pipelines.models import Models
from operators.dgp_kind import operator
p = next(p for p in Models(os.environ['ETLS_DATABASE_URL']).all_pipelines() if p['id'] == ID)
operator(p['name'], p['params'], p)
```

### Tests: what's missing

- The only tests are `tests/test_api_keys.py`, covering API keys and `check_permission`. They use a
  throwaway sqlite DB and a generated RSA pair, and need just `flask sqlalchemy flask-jsonpify
  pyjwt cryptography dgp-oauth2 pytest` (no Airflow): `PYTHONPATH=. python -m pytest tests`.
  `tox.ini` still targets `py36` and the full requirements. `setup.py`'s `tests_require`/`develop`
  extras are unused.
- CI only builds images. There is no lint (`pylama.ini` exists but nothing runs it), no
  Python or Angular tests (karma configs exist but there are no specs), and no smoke test of
  the built image.
- Nothing checks that downstream images still build against a new base.
- Highest-value additions: unit tests for `check_permission` and the role sets,
  `get_permissions`, `create_or_edit_pipeline`/`Models.create_or_edit` ownership and
  privacy, `dag_fetcher` schedule and `depends on` parsing, and `__get_logs` selection; plus
  a compose-based smoke test (start the stack, log in as the fake user, create/run a
  `printer` pipeline).

## 9. Known issues and security notes

Severity is a judgement call; all of these were confirmed by reading the code at `645d2ad`,
unless marked *unverified*.

### Security

| # | Issue | Where |
|---|---|---|
| S1 | **Permission tokens never expire** and carry the user's level, so demoting or deleting a user doesn't revoke access. Revocation requires rotating the key pair. | dgp_oauth2 `controllers.authorize` |
| S2 | **Fake OAuth provider when no provider keys are configured.** Anyone can log in as `fakeuser`. | dgp_oauth2 `Controllers.init_app`, `_fake_providers` |
| S3 | **Admin-only kinds and schedules are enforced only in the UI.** `POST /api/pipeline` accepts any `kind` (including `admin: true` kinds such as datacity's `muni_business_kinds`, which runs with `CKAN_API_KEY`) and any `schedule`. Maintainers can therefore create pipelines that Airflow runs automatically, without `pipelinesExecute`. | `pipelines/blueprint.edit_pipeline_`, `controllers.create_or_edit_pipeline` |
| S4 | **Anonymous requests can list and read every data record.** `DataViewerRoles` (in `AnonymousRoles`) includes `datarecordListAll` and `datarecordReadAll`, so a request with no token takes the "all" branch. (`datarecordReadAll` is also misspelled as `'datarecordReadOwn'`.) This may be intended for public records, but it covers every kind. | `permissions.py`, `datarecords/blueprint.py` |
| S5 | **GitHub login may match unverified emails** *(unverified against GitHub's current API)*. The callback walks `/user/emails` and uses the first address that matches an existing user, without checking `verified`. Adding a victim's address to a GitHub account could then log in as the victim (user id = `md5(email)`). | dgp_oauth2 `_get_user_profile` |
| S6 | `filesDownload` has no owner check: any Maintainer can get a presigned URL for any object by name, although listing is own-only. | `files/blueprint.download_file_` |
| S7 | Workbench users (Maintainer) can `POST /api/config` with `publish.allowed: true`; the next `/api/events/<uid>` then writes straight into `DATASETS_DATABASE_URL`. The `uid` query parameter is not sanitised (`os.path.join(BASE_PATH, uid)`), so `config.yaml` can be written into any existing directory the `etl` user can write to. | dgp-server `DgpServer.config` |
| S8 | The container user has passwordless sudo. Any code execution in the app (operators and taxonomy modules are Python) becomes root in the container. | `Dockerfile` |
| S9 | Development RSA key pair committed in `docker-compose.yml`. Make sure production never used it; if it did, anyone can mint Admin tokens. | `docker-compose.yml` |
| S10 | Flask `SECRET_KEY = '-'`; permissive credentialed CORS; JSONP on `/auth/*`. | `server.py`, dgp_oauth2 |

### Correctness

- `submitted` fires even when an edit was **rejected** (non-owner): `create_or_edit_pipeline`
  checks `submitted` but not `ret['success']`.
- `Models.delete(id, user)` uses `p['owner']` on an ORM object. The `pipelinesDeleteOwn`
  branch would raise, but only Admins have delete roles and they take the `DeleteAll` branch.
- `GET /api/pipeline/<unknown>` returns 500 for Maintainers (`result['owner']` KeyError).
  For Admins it returns `success: false` with a dummy status.
- `POST /api/pipeline/start/<id>` returns `{result: run_id}` without `success`, so the UI
  never refreshes after triggering. An unknown id returns 500.
- `POST /api/pipelines/start` without `kind` starts nothing (it compares against `None`).
- `__get_logs` with only queued TaskInstances picks the oldest TaskInstance, not the queued one.
- `AUTH_DATABASE_URL` is honoured by `/auth` only; users and files code reads `DATABASE_URL`.
- Edits replace the pipeline value, so the stored `result` disappears until the next run.
  The wrapper's write-back re-reads the record first, so edits made during a run are kept.
- `failed` event handlers are wired up but never triggered.
- CI's `dgp-app-db` job tags `server` (not `db`) as `akariv/dgp-app-db:<sha>`.
- `airflow db migrate || true` hides migration failures.
- The top-level README describes an older version (`configuration.yaml`,
  `akariv/airflow-config-ui`, `etl_server.models`).
