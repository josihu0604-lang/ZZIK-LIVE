# 🤝 Contributing to ZZIK LIVE

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS
- Redis
- Git

## 🚀 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Setup database: `npm run db:up && npm run db:migrate`
5. Start dev server: `npm run dev`

## 🌳 Branch Strategy

- `main` - Production branch
- `genspark_ai_developer` - Development branch
- `feature/*` - Feature branches (short-lived)

## 💻 Development Workflow

1. Create feature branch from `genspark_ai_developer`
2. Make changes following our coding standards
3. Write/update tests
4. Commit with conventional commit format
5. Push and create PR to `genspark_ai_developer`

## ✅ Commit Convention

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🧪 Testing

- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- All tests: `npm run test:all`

## 📝 Code Style

- ESLint: `npm run lint`
- Prettier: `npm run format`
- TypeScript: `npm run typecheck`

## 🔍 PR Checklist

- [ ] Tests pass
- [ ] No console errors
- [ ] Documentation updated
- [ ] Follows coding standards
- [ ] Responsive design verified
- [ ] Accessibility checked

## 📞 Contact

For questions, reach out to dev@zzik.live