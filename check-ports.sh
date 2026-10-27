#!/bin/bash
echo "== listeners =="
ss -ltnp 2>/dev/null || true
echo "== 5432 =="
ss -ltnp 2>/dev/null | grep 5432 || true
echo "== 5434 =="
ss -ltnp 2>/dev/null | grep 5434 || true
echo "== done =="
