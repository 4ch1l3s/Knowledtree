# Project Agent Instructions

## Backend Startup

When the user asks to start the backend, use the known development flow:

1. Start `Knowledtree.Web` with the normal project launch profile.
2. Check `https://localhost:44353` and/or `http://localhost:5000`.
3. If the dashboard loads, stop and report that the backend is running.
4. Do not investigate PostgreSQL, build logs, process lists, certificates, or sandbox-specific CLI failures unless the URL check actually fails.

The Visual Studio flow for this repo may show PostgreSQL startup messages during build. Treat that as normal unless the browser URL fails to load.
