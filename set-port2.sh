#!/bin/bash
sed -i "s/^port = .*/port = 5435/" /etc/postgresql/16/main/postgresql.conf
sed -i "s/^listen_addresses = .*/listen_addresses = '127.0.0.1'/" /etc/postgresql/16/main/postgresql.conf
service postgresql restart 2>&1 || true
sleep 1
service postgresql start 2>&1 || true
sleep 1
pg_lsclusters
su - postgres -c "psql -p 5435 -c \"DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lifexp') THEN CREATE ROLE lifexp LOGIN PASSWORD 'lifexp_password'; ELSE ALTER ROLE lifexp WITH LOGIN PASSWORD 'lifexp_password'; END IF; END \$\$;\"" 
su - postgres -c "psql -p 5435 -tc \"SELECT 1 FROM pg_database WHERE datname='lifexp'\" | grep -q 1 || createdb -p 5435 lifexp" || true
su - postgres -c "psql -p 5435 -d lifexp -c \"GRANT ALL ON DATABASE lifexp TO lifexp; GRANT ALL ON SCHEMA public TO lifexp;\""
echo READY_ON_5435
