#!/bin/bash

# FlashFusion E2E Test Runner
# Runs comprehensive end-to-end tests and generates reports

set -e

echo "🧪 FlashFusion E2E Test Suite"
echo "================================"

# Check if web server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Web server not running on http://localhost:3000"
    echo "Please start the web server first:"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Web server detected on http://localhost:3000"

# Change to E2E test directory
cd packages/e2e-tests

echo ""
echo "📦 Installing dependencies..."
npm install --silent

echo ""
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "🚀 Running E2E Tests..."
echo "------------------------"

# Run tests with different configurations
echo "Running smoke tests..."
npx playwright test smoke.spec.js --project chromium --reporter=json > smoke-results.json

echo ""
echo "📊 Generating Test Report..."
echo "----------------------------"

# Generate HTML report
npx playwright test smoke.spec.js --project chromium --reporter=html

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All E2E tests passed!"
    echo ""
    echo "📋 Test Results:"
    echo "- Screenshots: test-results/"
    echo "- HTML Report: playwright-report/index.html" 
    echo "- JSON Results: smoke-results.json"
    echo ""
    echo "To view the HTML report:"
    echo "  cd packages/e2e-tests && npx playwright show-report"
else
    echo ""
    echo "❌ Some E2E tests failed!"
    echo "Check the HTML report for details:"
    echo "  cd packages/e2e-tests && npx playwright show-report"
    exit 1
fi

echo ""
echo "🎉 E2E Test Suite completed successfully!"