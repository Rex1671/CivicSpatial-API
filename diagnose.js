const axios = require('axios');
const fs = require('fs');

async function diagnose(name, lat, lon) {
    const results = { name, lat, lon };

    // 1. BigDataCloud
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const bdc = await axios.get(bdcUrl);
        results.bigdatacloud = {
            countryCode: bdc.data.countryCode,
            city: bdc.data.city,
            locality: bdc.data.locality,
            administrative: bdc.data.localityInfo?.administrative || []
        };
    } catch (e) {
        results.bigdatacloud_error = e.message;
    }

    await new Promise(r => setTimeout(r, 1000));

    // 2. Nominatim
    try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18`;
        const nom = await axios.get(nomUrl, { headers: { 'User-Agent': 'DiagnosticScript/1.0' } });
        results.nominatim = {
            address: nom.data.address,
            category: nom.data.category,
            type: nom.data.type
        };
    } catch (e) {
        results.nominatim_error = e.message;
    }

    return results;
}

async function run() {
    const tests = [
        { name: 'Mumbai (Urban)', lat: 19.0760, lon: 72.8777 },
        { name: 'Rural UP', lat: 26.7922, lon: 82.1433 },
        { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
    ];

    const output = [];
    for (const t of tests) {
        console.log(`Diagnosing ${t.name}...`);
        const result = await diagnose(t.name, t.lat, t.lon);
        output.push(result);
        await new Promise(r => setTimeout(r, 2000));
    }

    fs.writeFileSync('diagnose_output.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('Done! Results written to diagnose_output.json');
}

run().catch(console.error);
