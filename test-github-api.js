#!/usr/bin/env node

/**
 * Test script for GitHub Repository Discovery API
 * Tests the API endpoint locally
 */

const http = require('http');

const TEST_HOST = 'localhost';
const TEST_PORT = 3001; // API development port

async function testAPI() {
    console.log('🧪 Testing GitHub Repository Discovery API...\n');
    
    const options = {
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: '/api/github/repositories?owner=Krosebrook',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    console.log('✅ API Response Status:', res.statusCode);
                    console.log('📊 Response Summary:');
                    
                    if (response.success) {
                        console.log(`   - Total Repositories: ${response.total_repositories}`);
                        console.log(`   - Owner: ${response.owner}`);
                        console.log(`   - Languages: ${response.summary?.languages?.join(', ') || 'N/A'}`);
                        console.log(`   - Total Stars: ${response.summary?.total_stars || 0}`);
                        console.log(`   - Total Forks: ${response.summary?.total_forks || 0}`);
                        
                        if (response.repositories && response.repositories.length > 0) {
                            console.log('\n🌟 Top 5 Repositories:');
                            response.repositories
                                .slice(0, 5)
                                .forEach((repo, index) => {
                                    console.log(`   ${index + 1}. ${repo.repo_name} (${repo.primary_language}) - ${repo.stars} ⭐`);
                                });
                        }
                    } else {
                        console.log(`   - Error: ${response.error}`);
                        console.log(`   - Message: ${response.message || 'No additional details'}`);
                    }
                    
                    resolve(response);
                } catch (error) {
                    console.error('❌ Failed to parse JSON response:', error.message);
                    console.log('Raw response:', data);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request failed:', error.message);
            console.log('💡 Make sure the API server is running on port 3001');
            console.log('   Run: cd apps/api && npm run dev');
            reject(error);
        });

        req.setTimeout(10000, () => {
            console.error('❌ Request timed out');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test API status endpoint
async function testStatusAPI() {
    console.log('\n🔍 Testing API Status Endpoint...\n');
    
    const options = {
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: '/api/status',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    console.log('✅ Status API Response:', res.statusCode);
                    console.log('📊 API Status:');
                    console.log(`   - Platform: ${response.platform}`);
                    console.log(`   - Version: ${response.version}`);
                    console.log(`   - Environment: ${response.environment}`);
                    console.log('📍 Available Routes:');
                    Object.entries(response.routes || {}).forEach(([name, path]) => {
                        console.log(`   - ${name}: ${path}`);
                    });
                    
                    resolve(response);
                } catch (error) {
                    console.error('❌ Failed to parse status response:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Status request failed:', error.message);
            reject(error);
        });

        req.end();
    });
}

async function main() {
    try {
        await testStatusAPI();
        await testAPI();
        console.log('\n✅ All tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testAPI, testStatusAPI };