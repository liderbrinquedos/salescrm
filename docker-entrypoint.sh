#!/bin/sh
set -e

echo "=> Verificando/ Criando tabelas do banco..."
npx prisma db push --skip-generate

echo "=> Iniciando aplicação..."
exec "$@"
