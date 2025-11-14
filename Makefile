.PHONY: up down migrate seed smoke load studio psql help

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start database container
	docker compose up -d db

down: ## Stop all containers
	docker compose down

migrate: ## Run Prisma migrations
	npx prisma migrate deploy

seed: ## Seed test data
	psql $$DATABASE_URL -f scripts/seed-test-data.sql

smoke: ## Run k6 smoke test
	k6 run tests/load/api-smoke.js

load: ## Run k6 load test
	k6 run tests/load/api-load.js

studio: ## Open Prisma Studio
	npx prisma studio

psql: ## Connect to database
	psql $$DATABASE_URL

dev: ## Start development server
	npm run dev

build: ## Build production
	npm run build

test: ## Run all tests
	npm run test:coverage && npm run test:e2e

clean: ## Clean build artifacts
	npm run clean

doctor: ## Check system health
	npm run doctor