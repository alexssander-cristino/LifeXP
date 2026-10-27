#!/bin/bash
sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '127.0.0.1'/" /etc/postgresql/16/main/postgresql.conf
grep -n "listen_addresses" /etc/postgresql/16/main/postgresql.conf
service postgresql restart
sleep 1
pg_lsclusters
