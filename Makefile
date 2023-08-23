DOCKER_PROJECT_NAME?=tokens_fetcher
COMPOSE_FILE?=docker/docker-compose.yaml

.PHONY: run
run: ## Start watching node server
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} run --rm --service-ports tokens-fetcher

.PHONY: build
build: ## Build containers
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} build
