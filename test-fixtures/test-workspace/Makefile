DOCKER_COMPOSE = docker-compose
EXEC_PHP       = $(DOCKER_COMPOSE) exec php
SYMFONY        = $(EXEC_PHP) bin/console
COMPOSER       = $(EXEC_PHP) composer
##
## Project main
## -----------------------
.PHONY: up
up: ## docker compose up
	$(DOCKER_COMPOSE) up --remove-orphans --no-recreate --detach --build

.PHONY: down
down: ## Down docker compose
	$(DOCKER_COMPOSE) kill
	$(DOCKER_COMPOSE) down --remove-orphans

.PHONY: clear-cache
clear-cache: ## Remove symfony cache and logs
	rm -rf var/logs var/cache

.PHONY: cache-warmup
cache-warmup: clear-cache vendor ## Symfony cache warmup
	$(SYMFONY) cache:warmup

.PHONY: rebuild
rebuild: vendor clear-cache cache-warmup  ## Rebuild project

vendor: composer.lock ## Install vendor
	$(COMPOSER) install
	touch vendor

##
## run shell
## -----------------------
.PHONY: bash-php
bash-php:  ## bash in php container
	$(EXEC_PHP) bash

##
## help
## -----------------------

.PHONY: help
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-24s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m## /[33m/' && printf "\n"

.DEFAULT_GOAL := help
