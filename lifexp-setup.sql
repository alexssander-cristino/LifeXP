DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lifexp') THEN
    CREATE ROLE lifexp LOGIN PASSWORD 'lifexp_password';
  ELSE
    ALTER ROLE lifexp WITH LOGIN PASSWORD 'lifexp_password';
  END IF;
END
$$;

SELECT 'CREATE DATABASE lifexp' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'lifexp')\gexec
GRANT ALL ON DATABASE lifexp TO lifexp;
\connect lifexp
GRANT ALL ON SCHEMA public TO lifexp;
