#!/bin/bash
set -e
echo "== apt update =="
apt-get update -qq >/tmp/apt.log 2>&1
echo "== install =="
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib redis-server >/tmp/install.log 2>&1
echo "== start services =="
service postgresql start
service redis-server start
echo "== configure db =="
su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" >/dev/null 2>&1 || true
su - postgres -c "createdb lifexp" >/dev/null 2>&1 || true
su - postgres -c "psql -c \"DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lifexp') THEN CREATE ROLE lifexp LOGIN PASSWORD 'lifexp_password'; END IF; END \$\$;\"" >/dev/null 2>&1 || true
su - postgres -c "psql -d lifexp -c \"GRANT ALL ON DATABASE lifexp TO lifexp; GRANT ALL ON SCHEMA public TO lifexp;\"" >/dev/null 2>&1 || true
echo "SETUP_DONE"
