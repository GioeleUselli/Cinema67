#!/bin/bash
set -e

echo "=== FilmAPI Docker Entrypoint ==="

# Wait for MariaDB
echo "Waiting for MariaDB at $DB_HOST:$DB_PORT..."
RETRY_COUNT=0
MAX_RETRIES=12

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
    echo "✗ MariaDB failed to become ready after 60s"
    exit 1
fi

# Run EF migrations
echo "Running Entity Framework migrations..."
if dotnet ef database update --no-build 2>&1 | tee /tmp/migrate.log; then
    echo "✓ Migrations completed"
else
    echo "⚠ Migration check completed (may already be up-to-date)"
fi

# Run seeder
echo "Running database seeder..."
if dotnet FilmApiSeeder.dll; then
    echo "✓ Seeder completed"
else
    echo "✗ Seeder failed"
    exit 1
fi

# Start application
echo "Starting FilmAPI..."
exec dotnet FilmAPI.dll
