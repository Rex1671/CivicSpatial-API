const https = require('https');

const coords = [
    { name: 'Mumbai (Urban)', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi (Urban)', lat: 28.6139, lon: 77.2090 },
    { name: 'Kerala Village (Rural)', lat: 9.5916, lon: 76.5222 },
    { name: 'UP Village (Rural)', lat: 26.7922, lon: 82.1433 }
];

async function fetchNominatim(lat, lon) {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&extratags=1&namedetails=1&zoom=18`;
        const options = {
            headers: {
                'User-Agent': 'IndianJurisdictionAPI/1.0 (test@example.com)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    for (const c of coords) {
        console.log(`\n--- Testing ${c.name} ---`);
        try {
            const data = await fetchNominatim(c.lat, c.lon);
            console.log('Class:', data.class, 'Type:', data.type, 'Category:', data.category);
            console.log('Address:', data.address);
        } catch (e) {
            console.error('Error fetching', c.name, e);
        }
        await new Promise(r => setTimeout(r, 1500)); // Sleep to respect rate limits
    }
}

run();
