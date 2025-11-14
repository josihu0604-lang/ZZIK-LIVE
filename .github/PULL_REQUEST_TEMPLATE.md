## 📋 Description

<!-- Provide a clear and concise description of what this PR does -->

## 🎯 Purpose

<!-- Why is this change necessary? What problem does it solve? -->

- Resolves #(issue number)

## 🔄 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix

## 📝 Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## 🧪 Testing

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit tests pass (`npm run test:unit`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### Test Coverage

<!-- If applicable, mention the test coverage percentage -->

- Current coverage: \_\_%
- Lines added: \_\_
- Lines covered: \_\_

## 🔒 Security & Privacy

<!-- Confirm security and privacy requirements -->

- [ ] No raw coordinates in logs (geohash5 only)
- [ ] Security headers verified (`npm run headers:verify`)
- [ ] No sensitive data exposed
- [ ] Rate limiting headers present
- [ ] Input validation implemented

## ⚡ Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance regression
- [ ] k6 smoke tests pass (if applicable)
- [ ] Response times meet SLA:
  - offers p95 ≤ 150ms
  - wallet p95 ≤ 100ms
  - search p95 ≤ 120ms

## 📸 Screenshots

<!-- If applicable, add screenshots to help explain your changes -->

## 📋 Checklist

<!-- Mark completed items with an "x" -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 🔗 Related PRs

<!-- List any related PRs -->

- #

## 📚 Additional Notes

<!-- Any additional information that reviewers should know -->

---

**Reviewer Guidelines:**

1. Check for geohash5 compliance (no raw coordinates)
2. Verify security headers are maintained
3. Ensure test coverage for new code
4. Validate performance metrics
5. Review for accessibility compliance
