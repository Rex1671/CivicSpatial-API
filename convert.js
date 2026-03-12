const fs = require('fs');

async function convertAC() {
    console.log("Reading Assembly Zip...");
    try {
        const shpjs = await import('shpjs');
        const buffer = fs.readFileSync('maps-master/assembly-constituencies/India_AC.zip');
        const geojson = await shpjs.default(buffer);
        fs.writeFileSync('maps-master/assembly-constituencies/india_ac_2019_simplified.geojson', JSON.stringify(geojson));
        console.log("Converted AC to geojson! " + geojson.features.length + " constituencies.");
    } catch(e) {
        console.log("Error", e);
    }
}

convertAC();
