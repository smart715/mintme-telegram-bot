DOCKER_PROJECT_NAME?=tokens_fetcher
COMPOSE_FILE?=docker/docker-compose.yaml

##@ Help

.PHONY: help
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: run
run: ## Start watching node server
	@docker compose -f ${COMPOSE_FILE} up -d

.PHONY: stop
stop: ## Stop all containers
	@docker compose -f ${COMPOSE_FILE} down

.PHONY: sh
sh: ## Open application with sh
	@docker compose -f ${COMPOSE_FILE} exec -it marketing-bot sh

.PHONY: logs
logs: ## Logs for all containers
	@docker compose -f ${COMPOSE_FILE} logs --follow

.PHONY: eslint
eslint: ## Run eslint checks
	@docker compose -f ${COMPOSE_FILE} exec -it marketing-bot npm run eslint
