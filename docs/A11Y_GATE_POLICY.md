# Accessibility Regression Gate Policy

## Overview
ZZIK LIVE enforces a **zero-tolerance policy** for accessibility regressions. All code changes must maintain WCAG 2.1 Level AA compliance before merging to main.

## Policy Statement
- **Zero accessibility violations** allowed in production code
- **WCAG 2.1 Level AA** is the minimum compliance standard
- **Automated blocking** via CI/CD pipeline
- **No exceptions** without explicit approval from accessibility team lead

## Automated Gate

### CI Workflow
The `a11y-regression-gate` GitHub Actions workflow runs on every PR:

1. **Builds production application**
2. **Runs comprehensive a11y tests** with Playwright + Axe
3. **Analyzes violations** against WCAG AA standards
4. **Blocks merge** if any violations detected
5. **Posts detailed report** to PR comments

### Test Coverage
Required a11y tests cover:

- ✅ **Keyboard Navigation**: Tab order, focus management, escape key
- ✅ **Screen Reader**: ARIA labels, roles, live regions
- ✅ **Color Contrast**: WCAG AA 4.5:1 minimum for text
- ✅ **Focus Indicators**: Visible focus states on all interactive elements
- ✅ **Form Accessibility**: Labels, error messages, input validation
- ✅ **Semantic HTML**: Proper heading hierarchy, landmarks
- ✅ **Alt Text**: All images have meaningful alternatives
- ✅ **Touch Targets**: Minimum 44x44px for mobile

## Branch Protection

### Required Status Checks
The following checks **MUST PASS** before merge:

```
✅ a11y-regression-gate
✅ build
✅ test
✅ lint
```

### GitHub Branch Protection Settings
To enable enforcement:

1. Go to **Settings → Branches → Branch protection rules**
2. Add rule for `main` branch:
   - ☑️ Require status checks to pass before merging
   - ☑️ Require branches to be up to date before merging
   - ☑️ Status checks that are required:
     - `a11y-regression-gate`
   - ☑️ Do not allow bypassing the above settings
3. Save changes

## Developer Workflow

### Before Committing
Run a11y tests locally:
```bash
npm run test:e2e:a11y
```

### If Violations Detected
1. Review the accessibility report in `playwright-report/`
2. Identify specific violations (element, rule, impact)
3. Fix violations according to WCAG guidelines
4. Re-run tests until all pass
5. Commit fixes and push

### Common Violations & Fixes

#### 1. Missing Alt Text
```tsx
// ❌ Bad
<img src="logo.png" />

// ✅ Good
<img src="logo.png" alt="ZZIK LIVE logo" />
```

#### 2. Insufficient Color Contrast
```css
/* ❌ Bad - 3.2:1 ratio */
color: #767676;
background: #ffffff;

/* ✅ Good - 4.6:1 ratio */
color: #595959;
background: #ffffff;
```

#### 3. Missing Form Labels
```tsx
// ❌ Bad
<input type="text" placeholder="Email" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />
```

#### 4. Keyboard Trap
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

#### 5. Missing ARIA Labels
```tsx
// ❌ Bad
<button onClick={handleClose}>×</button>

// ✅ Good
<button onClick={handleClose} aria-label="Close dialog">
  ×
</button>
```

## Enforcement

### CI Failure
If the a11y gate fails:

1. ❌ **PR cannot be merged** (status: failure)
2. 📝 **Detailed report posted** to PR comments
3. 🚫 **Merge button disabled** (if branch protection enabled)
4. 📊 **Test report uploaded** to GitHub Actions artifacts

### Override Process
In rare cases requiring urgent production fixes:

1. Create an **a11y exception ticket** explaining:
   - Why the violation cannot be fixed immediately
   - Impact assessment on users
   - Remediation plan with timeline
2. Get approval from:
   - ✅ Accessibility Team Lead
   - ✅ Product Owner
   - ✅ Engineering Manager
3. Document exception in:
   - PR description
   - Code comments
   - Technical debt backlog
4. Schedule remediation within **1 sprint**

## Monitoring

### Metrics Tracked
- ✅ Zero violations maintained (target: 100%)
- 📉 Average time to fix violations
- 📊 Violations by type
- 🎯 WCAG AA compliance score

### Reporting
- **Weekly**: A11y metrics in engineering dashboard
- **Monthly**: A11y status report to stakeholders
- **Quarterly**: Full WCAG audit by external auditors

## Resources

### Testing Tools
- [Playwright + Axe](https://playwright.dev/docs/accessibility-testing)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [a11y Project Checklist](https://www.a11yproject.com/checklist/)

### Internal
- [ZZIK LIVE A11y Checklist](./UX_A11Y_CHECKLIST.md)
- [Component Library A11y Patterns](../components/README.md)
- [Design System A11y Guidelines](../docs/design-system.md)

## FAQ

### Q: Can I disable the a11y gate for my PR?
**A:** No. The gate is enforced for all PRs without exception. However, you can request an exception through the formal override process.

### Q: What if the test is flaky?
**A:** Report flaky tests immediately. We investigate and fix flaky tests with high priority to maintain trust in the gate.

### Q: How long do fixes usually take?
**A:** Most violations can be fixed within 15-30 minutes. Complex violations may require design consultation.

### Q: Do we test on real assistive technology?
**A:** Yes. In addition to automated tests, we conduct manual testing with:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Voice control (Dragon, Voice Control)

### Q: What about third-party components?
**A:** You're responsible for ensuring third-party components meet our standards. Choose accessible-first libraries or wrap them with accessible interfaces.

## Contact

- **Slack**: #accessibility
- **Email**: a11y-team@zziklive.com
- **On-call**: accessibility-oncall@zziklive.com (urgent production issues)