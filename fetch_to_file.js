const axios = require('axios');
const fs = require('fs');

const coords = [
    { name: 'Mumbai (Urban)', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi (Urban)', lat: 28.6139, lon: 77.2090 },
    { name: 'Kerala Village (Rural)', lat: 9.5916, lon: 76.5222 },
    { name: 'UP Village (Rural)', lat: 26.7922, lon: 82.1433 }
];

async function run() {
    const results = [];
    for (const c of coords) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${c.lat}&lon=${c.lon}&format=jsonv2&extratags=1&namedetails=1&zoom=18`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'IndianJurisdictionAPI/1.0 (test@example.com)' }
            });
            results.push({ name: c.name, address: response.data.address });
        } catch (e) {
            results.push({ name: c.name, error: e.message });
        }
        await new Promise(r => setTimeout(r, 1500));
    }
    fs.writeFileSync('nominatim_results.json', JSON.stringify(results, null, 2));
    console.log('Done writing to nominatim_results.json');
}

run();
