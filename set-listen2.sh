#!/bin/bash
sed -i "s/^listen_addresses = .*/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
service postgresql restart 2>&1 || true
sleep 1
service postgresql start 2>&1 || true
sleep 1
pg_lsclusters
ss -ltn | grep 5435
