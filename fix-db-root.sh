#!/bin/bash
su - postgres -c "psql -c \"DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lifexp') THEN CREATE ROLE lifexp LOGIN PASSWORD 'lifexp_password'; ELSE ALTER ROLE lifexp WITH LOGIN PASSWORD 'lifexp_password'; END IF; END \$\$;\"" >/dev/null 2>&1 || true
su - postgres -c "createdb lifexp" >/dev/null 2>&1 || true
su - postgres -c "psql -d lifexp -c \"GRANT ALL ON DATABASE lifexp TO lifexp; GRANT ALL ON SCHEMA public TO lifexp;\"" >/dev/null 2>&1 || true
su - postgres -c "psql -c \"\du lifexp\""
echo FIX_DONE
