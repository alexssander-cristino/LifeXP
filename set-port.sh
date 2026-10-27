#!/bin/bash
sed -i 's/^port = 5434/port = 5432/' /etc/postgresql/16/main/postgresql.conf
service postgresql restart
sleep 1
pg_lsclusters
