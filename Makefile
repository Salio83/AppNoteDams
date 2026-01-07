# =============================================================================
# Configuration - Serveur Hugo
# =============================================================================
SERVER_IP = 74.161.160.129
SERVER_USER = hugo
SERVER_PATH = ~/appnotedams
APP_NAME = appnotedams

# =============================================================================
# Commandes principales
# =============================================================================

.PHONY: help dev build deploy sync prepare clean

help:
	@echo.
	@echo  ===== AppNoteDams - Commandes disponibles =====
	@echo.
	@echo  make dev          - Lancer le serveur de developpement local
	@echo  make build        - Construire l'application localement
	@echo  make sync         - Synchroniser le code source vers le serveur
	@echo  make deploy       - Sync + Docker build + restart sur le serveur
	@echo  make clean        - Nettoyer les fichiers generes
	@echo.

# Lancer le serveur de développement local
dev:
	npm run dev

# Construire l'application localement
build:
	@echo [BUILD] Construction de l'application...
	npm run build
	@echo [OK] Build termine dans dist/

# Préparer le serveur (fixer permissions + créer dossiers)
prepare:
	@echo [PREPARE] Preparation du serveur...
	ssh $(SERVER_USER)@$(SERVER_IP) "chmod -R 755 $(SERVER_PATH) 2>/dev/null || true && mkdir -p $(SERVER_PATH)/src/components $(SERVER_PATH)/src/pages $(SERVER_PATH)/src/utils $(SERVER_PATH)/src/context $(SERVER_PATH)/src/assets $(SERVER_PATH)/public"
	@echo [OK] Serveur pret!

# Synchroniser les fichiers source vers le serveur
sync: prepare
	@echo [SYNC] Synchronisation vers $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)...
	scp -r src/* $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)/src/
	scp package.json package-lock.json $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)/
	scp Dockerfile nginx.conf $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)/
	scp index.html vite.config.js tailwind.config.js postcss.config.js $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)/
	scp config_ue.json $(SERVER_USER)@$(SERVER_IP):$(SERVER_PATH)/
	@echo [OK] Fichiers synchronises!

# Déployer : sync + Docker build sur le serveur
deploy: sync
	@echo [DEPLOY] Build et demarrage Docker sur le serveur...
	ssh $(SERVER_USER)@$(SERVER_IP) "cd $(SERVER_PATH) && docker build -t $(APP_NAME) . && docker stop $(APP_NAME) 2>/dev/null || true && docker rm $(APP_NAME) 2>/dev/null || true && docker run -d --name $(APP_NAME) -p 80:80 --restart unless-stopped $(APP_NAME)"
	@echo [OK] Deploiement termine! App disponible sur http://$(SERVER_IP)

# Nettoyer les fichiers générés
clean:
	@echo [CLEAN] Nettoyage...
	@if exist dist rmdir /s /q dist
	@echo [OK] Nettoyage termine!
