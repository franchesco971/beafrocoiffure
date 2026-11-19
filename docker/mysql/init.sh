#!/bin/sh
# Exécuté une seule fois, à la création du volume. `prisma migrate dev` crée puis supprime une base
# « shadow » : l'utilisateur applicatif doit pouvoir le faire (sans accès aux autres bases).

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
GRANT ALL PRIVILEGES ON \`prisma\_migrate\_shadow\_db\_%\`.* TO '$MYSQL_USER'@'%';
SQL
