DOCKER_PROJECT_NAME?=markting_bot
COMPOSE_FILE?=docker/docker-compose.yaml

.PHONY: run
run: ## Start watching node server
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} run --rm --service-ports markting-bot

.PHONY: build
build: ## Build containers
	@docker-compose -p ${DOCKER_PROJECT_NAME} -f ${COMPOSE_FILE} build
