#!/bin/sh

until nc -z -v -w30 ${DB_HOST} 3306
do
    echo "Waiting for DB connection..."
    sleep 5
done

chown -R :www-data /src
chmod -R g+s /src

npm run typeorm migration:run

if [ "$NODE_ENV" == "production" ]; then
  npm run build;
  npm run start;
else
  npm run watch;
fi
