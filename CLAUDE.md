# CLAUDE.md

dgp-app is a Flask + aiohttp + Airflow app in a single container. It is the base image
`akariv/dgp-app`, which downstream images (e.g. datacity-importer → app.datacity.org.il)
build `FROM`. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making changes, and
[docs/API.md](docs/API.md) before touching routes or auth.

## Non-obvious things that will bite you

- **Auth is split across repos.** OAuth, the `/auth/*` routes and token issuing live in
  `dgp-oauth2` (`../../dgp-auth`). Levels and roles live in `etl_server/permissions.py`.
  `server.py` sets `ALLOWED_SERVICES=etl-server:etl_server` before importing `dgp_oauth2`,
  which is how `/auth/authorize` reaches `etl_server.get_permissions`.
- **Permission tokens (RS256, `X-Auth`) have no `exp`** and embed the user's level.
  Demoting or deleting a user does not revoke them.
- `check_permission([...])` tries roles **in list order** and passes the first match as
  `role=`. Views branch on it. Reordering the list changes behaviour. Roles are recomputed
  from `level` and the token's `roles` list is ignored.
- **No OAuth keys means a fake login** (`fakeuser`). That is fine locally and dangerous on a server.
- Role checks in the Angular UI are cosmetic. The server does **not** enforce `kinds[].admin`
  or the "non-admins may only pick `manual`" schedule rule. Add server-side checks if they matter.
- **DAGs come from `cached-pipelines.json`, not the DB.** It is rewritten only by the Flask
  API (startup, save, delete). Rows inserted straight into `etl_pipeline` don't become DAGs
  until the server restarts.
- `POST /api/pipeline` **replaces** the whole value. Send the full record back.
- `depends on: <id>` in a pipeline description adds an `ExternalTaskSensor` on the same
  logical date, so parent and child need the same schedule.
- The base repo's `taxonomies/index.yaml` has **no publishing module**. Data is written only
  by a downstream `_common_` (or per-taxonomy) `publishing_module`. datacity uses
  `dgp_server.publish_flow`: table = taxonomy id with `-`→`_`, rows deleted and re-inserted
  per `_source` (= `source.path`). Keep `source.path` stable or rows will duplicate.
- At run time, column types come from the pipeline's saved `dgpConfig`, not from the
  current taxonomy.
- `docker build` does **not** build the UI. Run `cd ui && npm install && npm run build_lib && npm run package` first
  (CI does this; `build_docker.sh` doesn't).
- Downstream images overwrite `dags/configuration.json`, `dags/operators/`, `taxonomies/`
  and `server_extra.py`, and they rely on the base image's passwordless `sudo`. Treat
  these paths as a public contract.
- Paths are relative to the CWD (`/app`): `dags/configuration.json`, `taxonomies/index.yaml`,
  `cached-pipelines.json`.
- `PRIVATE_KEY` must be set, or `import dgp_oauth2` fails. `AUTH_DATABASE_URL` only affects
  `/auth`; everything else reads `DATABASE_URL`.

## Working here

- The only tests are `tests/test_api_keys.py` (auth/API keys, no Airflow needed:
  `PYTHONPATH=. python -m pytest tests`). Verify anything else by running the compose
  stack (`touch creds.sh && docker compose up --build server`, then
  `docker compose exec server python mk_admin.py`).
- `tester.py` and `dags/tester.py` are stale. They call the dgp_kind operator with 2 of its 3
  arguments. See ARCHITECTURE §8 for a working snippet.
- Python 3.12 in the image, Airflow `<3`, Angular 16 (CI uses Node 16).
- Keep docs/ARCHITECTURE.md and docs/API.md in sync when you change routes, roles, env vars
  or the pipeline lifecycle.
