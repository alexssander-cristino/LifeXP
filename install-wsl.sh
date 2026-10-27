#!/bin/bash
set -e
echo "Atualizando indices de pacotes..."
sudo apt-get update -qq
echo "Instalando PostgreSQL e Redis..."
sudo apt-get install -y -qq postgresql postgresql-contrib redis-server
echo "Iniciando servicos..."
sudo service postgresql start
sudo service redis-server start
echo "Configurando banco lifexp..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='lifexp'" | grep -q 1 || sudo -u postgres createdb lifexp
sudo -u postgres psql -d lifexp -tc "SELECT 1 FROM pg_roles WHERE rolname='lifexp'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER lifexp WITH PASSWORD 'lifexp_password';"
sudo -u postgres psql -d lifexp -c "GRANT ALL ON DATABASE lifexp TO lifexp; GRANT ALL ON SCHEMA public TO lifexp;"
echo "Instalacao concluida."
