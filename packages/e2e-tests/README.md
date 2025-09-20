# FlashFusion E2E Tests

End-to-end testing for FlashFusion using Playwright to validate critical user journeys.

## Features

- **Cross-browser testing**: Chrome, Firefox, Safari, and mobile viewports
- **Visual regression testing**: Screenshots and video recordings on failures
- **Page Object Model**: Organized, maintainable test structure
- **CI/CD Integration**: GitHub Actions compatible with reports
- **Multiple test modes**: Headless, headed, and UI mode for debugging

## Test Coverage

### Critical User Journeys
- ✅ Landing page interaction and navigation
- ✅ Fusion dashboard functionality (tabs, components)
- ✅ Project creation workflow
- ✅ Code editor interactions (Monaco editor)
- ✅ AI chat assistant functionality
- ✅ Preview functionality (device modes)
- ✅ User research workflow integration
- ✅ Web scraping service integration
- ✅ Agent orchestration capabilities
- ✅ Cross-page navigation and state persistence
- ✅ Responsive design validation
- ✅ Performance and loading states
- ✅ Accessibility features
- ✅ Error handling

## Quick Start

### Prerequisites
- Node.js 16+ 
- FlashFusion web application running on http://localhost:3000

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI (headed)
npm run test:headed

# Run tests with Playwright UI (debugging)
npm run test:ui

# Run specific test file
npx playwright test landing-page.spec.js

# Run tests in debug mode
npm run test:debug
```

### Running from Root (Turborepo)
```bash
# Run E2E tests across the entire monorepo
npm run test:e2e

# Run headed E2E tests
npm run test:e2e:headed

# Run UI mode for E2E tests
npm run test:e2e:ui
```

## Test Reports

After running tests, reports are generated:

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results.json`
- **JUnit XML**: `test-results.xml`

View the HTML report:
```bash
npm run report
```

## Test Structure

```
tests/
├── utils/               # Page Object Models and utilities
│   ├── BasePage.js     # Base page class with common methods
│   ├── LandingPage.js  # Landing page interactions
│   └── FusionDashboardPage.js # Dashboard functionality
├── fixtures/           # Test data and fixtures
├── landing-page.spec.js      # Landing page tests
├── fusion-dashboard.spec.js  # Dashboard critical flows
└── workflow-integration.spec.js # Integration tests
```

## Configuration

Key configuration files:
- `playwright.config.js` - Main Playwright configuration
- `.env.example` - Environment variables template
- `package.json` - Dependencies and scripts

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
BASE_URL=http://localhost:3000
NODE_ENV=test
HEADLESS=true
```

## Page Object Models

Tests use the Page Object Model pattern for maintainability:

```javascript
import { LandingPage } from '../utils/LandingPage.js';

test('should create project', async ({ page }) => {
  const landingPage = new LandingPage(page);
  await landingPage.navigateToHome();
  await landingPage.createProject('Build a todo app');
});
```

## CI/CD Integration

For GitHub Actions, add this step:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: packages/e2e-tests/playwright-report/
```

## Debugging

### Debugging Failed Tests
1. Run with UI mode: `npm run test:ui`
2. Use debug mode: `npm run test:debug`
3. Check screenshots in `test-results/`
4. Review video recordings for failures

### Recording New Test Actions
Use Playwright codegen to record interactions:
```bash
npm run codegen
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting
3. **Take screenshots** at key steps for debugging
4. **Keep tests independent** - each test should work in isolation
5. **Use page object models** for reusable functionality

## Troubleshooting

### Common Issues

**Tests failing locally but passing in CI:**
- Check viewport sizes and timing
- Verify environment variables
- Ensure consistent data state

**Flaky tests:**
- Add explicit waits for elements
- Use `waitForLoadState('networkidle')`
- Increase timeouts for slow operations

**Browser installation issues:**
```bash
npx playwright install --force
```

## Contributing

When adding new tests:
1. Follow the existing Page Object Model pattern
2. Add meaningful assertions
3. Include error screenshots
4. Update this README if adding new test suites