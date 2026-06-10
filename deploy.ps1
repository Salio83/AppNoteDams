# Script de déploiement pour AppNoteDams
$SERVER_IP = "161.97.124.132"
$SERVER_USER = "root"
$SERVER_PATH = "~/appnotedams"

Write-Host "--- 1. Préparation du serveur ---" -ForegroundColor Cyan
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH/prisma"

Write-Host "--- 2. Transfert des fichiers de configuration ---" -ForegroundColor Cyan
scp docker-compose.yml .env nginx_conf.template Dockerfile.frontend Dockerfile.backend vite.config.js package.json package-lock.json index.html tailwind.config.js postcss.config.js config_ue.json nginx.conf "$($SERVER_USER)@$($SERVER_IP):$($SERVER_PATH)/"

Write-Host "--- 3. Transfert des dossiers sources ---" -ForegroundColor Cyan
scp -r src "$($SERVER_USER)@$($SERVER_IP):$($SERVER_PATH)/"
scp -r server "$($SERVER_USER)@$($SERVER_IP):$($SERVER_PATH)/"
scp -r public "$($SERVER_USER)@$($SERVER_IP):$($SERVER_PATH)/"
scp -r prisma/schema.prisma prisma/migrations "$($SERVER_USER)@$($SERVER_IP):$($SERVER_PATH)/prisma/"

Write-Host "--- 4. Build et Redémarrage Docker sur le serveur ---" -ForegroundColor Cyan
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker compose down && docker compose up --build -d"

Write-Host "--- 5. Mise à jour de la base de données (Migrations) ---" -ForegroundColor Cyan
# Attendre un peu que le conteneur soit prêt
Start-Sleep -Seconds 10
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker compose exec -T backend npx prisma migrate deploy"

Write-Host "--- 6. Régénération du Prisma Client ---" -ForegroundColor Cyan
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker compose exec -T backend npx prisma generate"

Write-Host "--- 7. Rechargement du Reverse Proxy Global et Local ---" -ForegroundColor Cyan
ssh $SERVER_USER@$SERVER_IP "systemctl reload nginx || service nginx reload || true"
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker compose exec -T frontend nginx -s reload"

Write-Host "--- 8. Redémarrage du backend ---" -ForegroundColor Cyan
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker compose restart backend"

Write-Host "--- DÉPLOIEMENT TERMINÉ ---" -ForegroundColor Green
Write-Host "L'application est en cours de build sur le serveur."
Write-Host "Accès : https://krono-etu.com"
