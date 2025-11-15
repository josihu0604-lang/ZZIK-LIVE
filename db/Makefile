.PHONY: up down logs migrate seed reset status clean

# Start database container
up:
	@echo "🚀 Starting PostgreSQL with PostGIS..."
	@docker compose -f compose.yml up -d
	@echo "✅ Database started on port 5432"

# Stop and remove database container
down:
	@echo "🛑 Stopping PostgreSQL..."
	@docker compose -f compose.yml down -v
	@echo "✅ Database stopped and volumes removed"

# Show database logs
logs:
	@docker compose -f compose.yml logs -f

# Check database status
status:
	@docker compose -f compose.yml ps

# Run Prisma migrations
migrate:
	@echo "📦 Running database migrations..."
	@cd .. && npx prisma migrate deploy
	@echo "✅ Migrations complete"

# Run database seed
seed:
	@echo "🌱 Seeding database..."
	@cd .. && npx tsx db/seed/index.ts
	@echo "✅ Seeding complete"

# Full reset: down, up, migrate, seed
reset: down up
	@sleep 5
	@$(MAKE) migrate
	@$(MAKE) seed
	@echo "✅ Database reset complete"

# Clean database volumes
clean:
	@echo "🧹 Cleaning database volumes..."
	@docker volume prune -f
	@echo "✅ Volumes cleaned"