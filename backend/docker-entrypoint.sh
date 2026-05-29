#!/bin/bash
set -e

echo "=== FilmAPI Docker Entrypoint ==="
echo "Starting FilmAPI (bootstrap, migrations, and seeding handled in Program.cs)..."
exec dotnet FilmAPI.dll
