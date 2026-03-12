const axios = require('axios');
const fs = require('fs');

async function test(name, lat, lon) {
    console.log(`Testing ${name}...`);
    try {
        const res = await axios.get(`http://localhost:3000/api/place-data?lat=${lat}&lon=${lon}`);
        fs.writeFileSync(`test_${name.replace(/ /g, '_')}.json`, JSON.stringify(res.data, null, 2));
        console.log(`  Success! Saved to test_${name.replace(/ /g, '_')}.json`);
    } catch (e) {
        console.error(`  Failed: ${e.message}`);
    }
}

async function run() {
    await test('Mumbai', 19.0760, 72.8777);
    await test('Rural_UP', 26.7922, 82.1433);
    await test('Delhi', 28.6139, 77.2090);
    console.log('\nDone testing.');
}

run();
