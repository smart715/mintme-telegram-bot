DOCKER_PROJECT_NAME?=tokens_fetcher
COMPOSE_FILE?=docker/docker-compose.yaml

##@ Help

.PHONY: help
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)


.PHONY: run
run: ## Start watching node server
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} run --rm --service-ports tokens-fetcher

.PHONY: build
build: ## Build containers
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} build
