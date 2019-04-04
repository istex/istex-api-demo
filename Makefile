.PHONY: build install

.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# If the first argument is one of the supported commands...
SUPPORTED_COMMANDS := npm
SUPPORTS_MAKE_ARGS := $(findstring $(firstword $(MAKECMDGOALS)), $(SUPPORTED_COMMANDS))
ifneq "$(SUPPORTS_MAKE_ARGS)" ""
    # use the rest as arguments for the command
    COMMAND_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
    # ...and turn them into do-nothing targets
    $(eval $(COMMAND_ARGS):;@:)
endif


install: ## install dependencies thanks to a dockerized npm install
	@docker run -it --rm -v $$(pwd):/app -w /app --net=host -e NODE_ENV -e http_proxy -e https_proxy node:10.0.0 npm install --unsafe-perm
	@make chown

build: ## build the docker inistcnrs/ezmaster images localy
	@docker-compose -f ./docker-compose.yml build

run-prod: ## run istex-api-demo in production mode
	@docker-compose -f ./docker-compose.yml up -d

start-prod: ## start istex-api-demo production daemon (needs a first run-prod the first time)
	@docker-compose -f ./docker-compose.yml start

stop-prod: ## stop istex-api-demo production daemon
	@docker-compose -f ./docker-compose.yml stop

run-debug: ## run istex-api-demo in debug mode
	@docker-compose -f ./docker-compose.debug.yml up -d

kill: ## kill istex-api-demo running containers
	@docker-compose -f ./docker-compose.debug.yml kill

rm: ## remove istex-api-demo containers even if they are running
	@docker-compose -f ./docker-compose.debug.yml rm -f

chown: ## makefile rule used to keep current user's unix rights on the docker mounted files
	@test ! -d $$(pwd)/node_modules || docker run -it --rm -v $$(pwd):/app node:10.0.0 chown -R $$(id -u):$$(id -g) /app/

npm: ## npm wrapper. example: make npm install --save mongodb-querystring
	@docker run -it --rm -v $$(pwd):/app -w /app --net=host -e NODE_ENV -e http_proxy -e https_proxy node:10.0.0 npm $(filter-out $@,$(MAKECMDGOALS))
	@make chown

clean: ## remove node_modules
	@rm -Rf ./node_modules/
