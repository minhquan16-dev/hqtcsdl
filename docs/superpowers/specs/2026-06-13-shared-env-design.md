# Shared Env Design

## Goal

Move database environment configuration into a single shared location so both `backend` and `DataWareHouse/build_dw.py` read the same values.

## Scope

- Add `env/.env` as the shared runtime configuration file.
- Add `env/.env.example` as the tracked template.
- Update backend startup/config loading to read `env/.env`.
- Update `DataWareHouse/build_dw.py` to read `env/.env` and keep safe handling for missing or partial auth configuration.

## Design

- `env/.env` becomes the source of truth for shared database settings.
- Backend loads `../env/.env` explicitly so it no longer depends on `backend/.env`.
- `build_dw.py` loads and parses `env/.env` directly without adding Python package dependencies.
- `build_dw.py` uses SQL authentication when both `DB_USER` and `DB_PASSWORD` exist; otherwise it falls back to Windows authentication, matching the original script behavior more closely.

## Error Handling

- Backend still exits early when required DB variables are missing.
- `build_dw.py` exits with a clear message when `DB_SERVER` is missing or when `sqlcmd` is unavailable.
- Boolean-like env values are parsed safely with explicit accepted values.

## Verification

- Confirm backend can resolve config from `env/.env`.
- Confirm `build_dw.py` builds a `sqlcmd` command from env values instead of hard-coded settings.
