#!/bin/bash
set -e

echo "=== FilmAPI Docker Entrypoint ==="

# Wait for MariaDB
echo "Waiting for MariaDB at $DB_HOST:$DB_PORT..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1" &>/dev/null; then
        echo "✓ MariaDB is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "MariaDB not ready (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 5s..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "✗ MariaDB failed to become ready after 150s"
    exit 1
fi

echo "Starting FilmAPI (migrations + seeding run automatically in Program.cs)..."
exec dotnet FilmAPI.dll
