const coords = [
    { name: 'Mumbai (Urban)', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi (Urban)', lat: 28.6139, lon: 77.2090 },
    { name: 'Kerala Village (Rural)', lat: 9.5916, lon: 76.5222 },
    { name: 'UP Village (Rural)', lat: 26.7922, lon: 82.1433 }
];

async function run() {
    for (const c of coords) {
        console.log(`\n--- Testing ${c.name} ---`);
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${c.lat}&lon=${c.lon}&format=jsonv2&extratags=1&namedetails=1&zoom=18`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'IndianJurisdictionAPI/1.0 (test@example.com)'
                }
            });
            const data = await response.json();
            console.log('Address obj:', JSON.stringify(data.address, null, 2));
        } catch (e) {
            console.error('Error fetching', c.name, e);
        }
        await new Promise(r => setTimeout(r, 1500));
    }
}

run();
