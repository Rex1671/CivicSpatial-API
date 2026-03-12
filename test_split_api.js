const axios = require('axios');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const SAMPLE_COORDS = { lat: 19.0760, lon: 72.8777 }; // Mumbai

const endpoints = [
    { name: 'Jurisdiction', path: '/api/jurisdiction', keys: ['jurisdiction', 'insights'] },
    { name: 'Electoral', path: '/api/electoral', keys: ['representatives'] },
    { name: 'Wards', path: '/api/wards', keys: ['metro_data'] },
    { name: 'Infrastructure', path: '/api/infrastructure', keys: ['infrastructure'] },
    { name: 'Health', path: '/api/health', keys: ['status'] }
];

async function testEndpoints() {
    console.log(`Starting API tests against: ${BASE_URL}`);
    console.log(`Testing coordinates: Lat=${SAMPLE_COORDS.lat}, Lon=${SAMPLE_COORDS.lon}\n`);

    const results = await Promise.allSettled(
        endpoints.map(async (ep) => {
            const start = Date.now();
            try {
                const response = await axios.get(`${BASE_URL}${ep.path}`, {
                    params: SAMPLE_COORDS,
                    timeout: 10000 // 10s timeout
                });
                const duration = Date.now() - start;
                
                // Validate keys
                const missingKeys = ep.keys.filter(key => response.data[key] === undefined);
                
                return {
                    name: ep.name,
                    status: 'SUCCESS',
                    statusCode: response.status,
                    duration: `${duration}ms`,
                    missingKeys: missingKeys.length > 0 ? missingKeys : 'None',
                    dataPreview: JSON.stringify(response.data).substring(0, 100) + '...'
                };
            } catch (error) {
                return {
                    name: ep.name,
                    status: 'FAILED',
                    error: error.message,
                    statusCode: error.response?.status || 'N/A'
                };
            }
        })
    );

    console.table(results.map(r => r.value));

    const allPassed = results.every(r => r.value.status === 'SUCCESS');
    if (allPassed) {
        console.log('\n✅ All endpoints responded successfully.');
    } else {
        console.log('\n❌ Some endpoints failed.');
    }
}

testEndpoints();
