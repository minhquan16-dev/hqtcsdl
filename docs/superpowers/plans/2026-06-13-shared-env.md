# Shared Env Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize shared database configuration in `env/.env` for both backend and DataWareHouse.

**Architecture:** Keep one shared env file at the repository root under `env/`, then make each consumer load it explicitly by path. For Python, parse the file locally to avoid introducing new dependencies.

**Tech Stack:** Node.js, `dotenv`, Python standard library, SQL Server `sqlcmd`

---

### Task 1: Add shared env files

**Files:**
- Create: `env/.env`
- Create: `env/.env.example`

- [ ] Add the shared runtime env file with the current DB values.
- [ ] Add the example env file with placeholder secrets and the same keys.

### Task 2: Point backend to shared env

**Files:**
- Modify: `backend/server.js`
- Modify: `backend/config/db.js`

- [ ] Load `env/.env` from a stable absolute path.
- [ ] Keep backend validation behavior intact after the env source moves.

### Task 3: Point DataWareHouse script to shared env

**Files:**
- Modify: `DataWareHouse/build_dw.py`

- [ ] Replace hard-coded connection settings with values from `env/.env`.
- [ ] Keep `sqlcmd` invocation behavior and preserve Windows-auth fallback when SQL credentials are absent.

### Task 4: Verify behavior

**Files:**
- No persistent files

- [ ] Run a Node command that resolves backend DB config from `env/.env`.
- [ ] Run a Python command that shows `build_dw.py` now derives its `sqlcmd` command from env values.
