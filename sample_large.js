const fs = require('fs');
const path = require('path');

// Read a sample of properties from the output to understand schemas
// by writing output file with a manageable set of data types to a JSON results file

async function sampleFile(filepath) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filepath, { encoding: 'utf8', highWaterMark: 256 * 1024 });
        let buffer = '';
        let props = [];
        let done = false;
        stream.on('data', chunk => {
            if (done) return;
            buffer += chunk;
            // Try to find up to 3 different property objects
            let searchFrom = 0;
            while (props.length < 3) {
                const propIdx = buffer.indexOf('"properties"', searchFrom);
                if (propIdx === -1) break;
                let depth = 0;
                let start = buffer.indexOf('{', propIdx);
                if (start === -1) break;
                let found = false;
                for (let i = start; i < buffer.length; i++) {
                    if (buffer[i] === '{') depth++;
                    else if (buffer[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            try {
                                const p = JSON.parse(buffer.slice(start, i + 1));
                                props.push(p);
                                searchFrom = i + 1;
                                found = true;
                            } catch (e) {}
                            break;
                        }
                    }
                }
                if (!found) break;
            }
            if (props.length >= 3) { done = true; stream.destroy(); resolve(props); }
        });
        stream.on('error', reject);
        stream.on('close', () => resolve(props));
    });
}

async function run() {
    const files = {
        'HIGHWAYS': './INDIAN-SHAPEFILES-master/INDIA/INDIA_NATIONAL_HIGHWAY.geojson',
        'RAILWAYS': './INDIAN-SHAPEFILES-master/INDIA/INDIAN_RAILWAYS.geojson',
        'PINCODES': './INDIAN-SHAPEFILES-master/INDIA/INDIAN_PINCODE_BOUNDARY.geojson',
    };
    
    const results = {};
    for (const [key, f] of Object.entries(files)) {
        const sizeMB = (fs.statSync(f).size / 1024 / 1024).toFixed(1);
        console.log(`Reading ${key} (${sizeMB} MB)...`);
        const samples = await sampleFile(f);
        results[key] = { sizeMB, samples };
    }
    
    fs.writeFileSync('large_file_schemas.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('Written to large_file_schemas.json');
}

run().catch(console.error);
