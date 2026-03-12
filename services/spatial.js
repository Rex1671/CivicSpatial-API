const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Granular Turf imports for smaller bundle size
const { point: turfPoint } = require('@turf/helpers');
const { default: turfBBox } = require('@turf/bbox');
const { default: turfBooleanPointInPolygon } = require('@turf/boolean-point-in-polygon');
const { default: turfDistance } = require('@turf/distance');
const { default: turfPointToLineDistance } = require('@turf/point-to-line-distance');

const turf = {
    point: turfPoint,
    bbox: turfBBox,
    booleanPointInPolygon: turfBooleanPointInPolygon,
    distance: turfDistance,
    pointToLineDistance: turfPointToLineDistance
};

const ensureTurf = async () => turf;


// Cache for loaded GeoJSON datasets
const dataCache = new Map();

/**
 * Lazy-loads a GeoJSON file and caches it.
 * Precomputes TurfJS Bounding Boxes on load for extremely fast operations.
 */
async function loadGeoJSON(filepath) {
    if (dataCache.has(filepath)) return dataCache.get(filepath);
    
    if (!fs.existsSync(filepath)) return null;

    const stats = fs.statSync(filepath);
    const sizeMB = stats.size / (1024 * 1024);

    // Cache files up to 150MB fully in memory (handles 90MB Pincode shapefile)
    if (sizeMB < 150) {
        try {
            console.log(`Loading ${filepath} into cache (${sizeMB.toFixed(1)} MB)...`);
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            const turfModule = await ensureTurf();
            
            // Precompute bounding boxes for every feature immediately
            let count = 0;
            if (data.features) {
                data.features.forEach(f => {
                    if (f.geometry) {
                        try {
                            f.bbox = turfModule.bbox(f);
                            count++;
                        } catch (e) {}
                    }
                });
            }
            console.log(`  BBox precomputed for ${count} features.`);
            
            dataCache.set(filepath, data);
            return data;
        } catch (e) {
            console.error(`Error loading GeoJSON ${filepath}:`, e.message);
            return null;
        }
    }
    return null; 
}

/**
 * Fast check if a point [lon, lat] is inside a feature's bounding box [minX, minY, maxX, maxY].
 */
function isPointInBBox(ptCoords, bbox) {
    if (!bbox || bbox.length !== 4) return true; // Fallback if no bbox
    const lon = ptCoords[0];
    const lat = ptCoords[1];
    return lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
}

/**
 * Fast search for a point in a GeoJSON dataset using BBox filtering first.
 */
async function getIntersection(filepath, point) {
    const data = await loadGeoJSON(filepath);
    if (!data || !turf) return null;

    const ptCoords = point.geometry.coordinates;
    const candidates = [];

    // Filter by Bounding Box first (O(N) but microsecond per item)
    for (const feature of data.features) {
        if (feature.bbox && isPointInBBox(ptCoords, feature.bbox)) {
            candidates.push(feature);
        }
    }

    // Heavy Turf boolean operation only for bbox hits (usually 1-3 candidates)
    for (const feature of candidates) {
        try {
            if (turf.booleanPointInPolygon(point, feature)) {
                return feature.properties;
            }
        } catch (e) {}
    }
    return null;
}

/**
 * Finds the nearest point or line in a GeoJSON dataset using BBox filtering.
 */
async function findNearest(filepath, point, options = {}) {
    console.log(`Searching nearest in ${filepath}...`);
    const data = await loadGeoJSON(filepath);
    if (!data || !turf) {
        console.log(`  Data or Turf missing for ${filepath}`);
        return null;
    }

    let nearest = null;
    let minDistance = options.maxDistance || Infinity;
    let count = 0;

    const ptCoords = point.geometry.coordinates;

    for (const feature of data.features) {
        if (!feature.geometry) continue;
        
        // Fast BBox rejection based on maxDistance constraint roughly converted to decimal degrees.
        // 1 degree lat is ~111km. At equator 1 degree lon is ~111km.
        const maxDeg = minDistance / 100; // rough heuristic (safe oversize)
        if (feature.bbox && minDistance !== Infinity) {
             const [minX, minY, maxX, maxY] = feature.bbox;
             // Is the point further away bounding-box-wise than our current best distance?
             if (ptCoords[0] < minX - maxDeg || ptCoords[0] > maxX + maxDeg ||
                 ptCoords[1] < minY - maxDeg || ptCoords[1] > maxY + maxDeg) {
                 continue; // skip expensive geometry distance check
             }
        }

        count++;
        let distance;
        try {
            if (feature.geometry.type === 'Point') {
                distance = turf.distance(point, feature);
            } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                distance = turf.pointToLineDistance(point, feature, { units: 'kilometers' });
            } else {
                continue;
            }

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { properties: feature.properties, distance_km: parseFloat(distance.toFixed(2)) };
            }
        } catch (e) { 
            continue; 
        }
    }
    console.log(`  Scanned ${count} bounding boxes out of ${data.features.length}. Nearest: ${nearest ? nearest.distance_km : 'NONE'} km`);
    return nearest;
}

// Base paths
// Vercel deployment struggles to bundle complex globs across multiple scattered directories,
// so all essential files were moved to `vercel_data` for seamless Serverless deployments.
const BASE_DATA_DIR = path.join(__dirname, '..', 'vercel_data');

const PARLIAMENTARY_PATH = path.join(BASE_DATA_DIR, 'constituencies', 'india_pc_2019_simplified.geojson');
const ASSEMBLY_PATH = path.join(BASE_DATA_DIR, 'constituencies', 'india_ac_2019_simplified.geojson');
const SUB_DISTRICTS_PATH = path.join(BASE_DATA_DIR, 'constituencies', 'INDIAN_SUB_DISTRICTS.geojson');
const POLICE_PATH = path.join(BASE_DATA_DIR, 'infra', 'INDIA_POLICE_STATIONS.geojson');

/**
 * Finds Parliamentary and Assembly Constituencies
 */
async function getConstituencies(lat, lon) {
    const turf = await ensureTurf();
    const point = turf.point([lon, lat]);

    const pcData = await loadGeoJSON(PARLIAMENTARY_PATH);
    const acData = await loadGeoJSON(ASSEMBLY_PATH);

    const ptCoords = point.geometry.coordinates;
    const findMatch = (data) => {
        if (!data) return null;
        // BBox filter
        const candidates = data.features.filter(f => f.bbox ? isPointInBBox(ptCoords, f.bbox) : true);
        // Turf polygon test on winners
        return candidates.find(f => {
            try { return turf.booleanPointInPolygon(point, f); } catch(e) { return false; }
        })?.properties;
    };

    const pcProps = findMatch(pcData);
    const acProps = findMatch(acData);

    return {
        mp: pcProps ? { name: pcProps.pc_name || pcProps.PC_NAME, state: pcProps.st_name || pcProps.ST_NAME } : null,
        mla: acProps ? { name: acProps.ac_name || acProps.AC_NAME, no: acProps.ac_no || acProps.AC_NO, state: acProps.st_name || acProps.ST_NAME } : null
    };
}

/**
 * Enriches data with Sub-district, Police Station, Highway, Railway, and Ward info
 * @param {boolean} includeHeavy Whether to load massive files (>50MB) like Pincodes and Highways. Disable for Vercel.
 */
async function getEnrichedSpatialData(lat, lon, cityName, includeHeavy = true) {
    const turf = await ensureTurf();
    console.log(`Enriching data for ${lat}, ${lon} (${cityName})...`);
    const point = turf.point([lon, lat]);
    const ptCoords = point.geometry.coordinates;
    const results = {};

    const findMatch = (data) => {
        if (!data) return null;
        const candidates = data.features.filter(f => f.bbox ? isPointInBBox(ptCoords, f.bbox) : true);
        return candidates.find(f => {
            try { return turf.booleanPointInPolygon(point, f); } catch(e) { return false; }
        });
    };

    // 1. Sub-District (20MB)
    const sdData = await loadGeoJSON(SUB_DISTRICTS_PATH);
    if (sdData) {
        const feature = findMatch(sdData);
        if (feature) {
            console.log(`  Sub-district found: ${feature.properties.subdtname || feature.properties.SDTNAME}`);
            results.sub_district = feature.properties;
        } else {
            console.log(`  No sub-district polygon match for ${lat}, ${lon}`);
        }
    }

    // 2. Nearest Police Station (5MB - Pre-loaded)
    results.police_station = await findNearest(POLICE_PATH, point, { maxDistance: 50 });

    if (includeHeavy) {
        // 3. Pincode (90MB - Now cached and BBox filtered)
        const pinPath = path.join(__dirname, '..', 'INDIAN-SHAPEFILES-master', 'INDIA', 'INDIAN_PINCODE_BOUNDARY.geojson');
        results.pincode = await getIntersection(pinPath, point);

        // 4. Infrastructure (Highways/Railways)
        const highwayPath = path.join(__dirname, '..', 'INDIAN-SHAPEFILES-master', 'INDIA', 'INDIA_NATIONAL_HIGHWAY.geojson');
        const railwayPath = path.join(__dirname, '..', 'INDIAN-SHAPEFILES-master', 'INDIA', 'INDIAN_RAILWAYS.geojson');
        
        results.highway = await findNearest(highwayPath, point, { maxDistance: 50 });
        results.railway = await findNearest(railwayPath, point, { maxDistance: 50 });
    } else {
        // Light Vercel mode: skip massive 90MB pin shapefile, but Railways are smaller (30MB) and might fit, 
        // but user asked to remove features that push the limit. Let's skip them both to be safe and ensure the build succeeds.
        console.log(`  Skipping heavy infrastructure lookups for Vercel Free Tier compatibility.`);
    }

    // 5. Municipal/Metro Ward
    if (cityName) {
        const WARD_DIR = path.join(BASE_DATA_DIR, 'wards');
        let normalizedCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // City Aliases for mismatched filenames
        const aliases = {
            'mumbai': 'bmc',
            'bangalore': 'bengaluru',
            'ahmedabad': 'ahmadabad'
        };
        const searchTerms = [normalizedCity];
        if (aliases[normalizedCity]) searchTerms.push(aliases[normalizedCity]);

        let targetWardPath = null;
        try {
            // Scan the wards subdirectory
            const scanWards = (dir) => {
                if (!fs.existsSync(dir)) return;
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    if (fs.statSync(fullPath).isDirectory()) {
                        scanWards(fullPath);
                        if (targetWardPath) return;
                    } else if (item.endsWith('.geojson')) {
                        const normalizedFile = item.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (searchTerms.some(term => normalizedFile.includes(term))) {
                            targetWardPath = fullPath;
                            return;
                        }
                    }
                }
            };
            scanWards(WARD_DIR);
        } catch (e) {
            console.error('Error scanning for ward bounds:', e.message);
        }

        if (targetWardPath) {
            const wardData = await loadGeoJSON(targetWardPath);
            if (wardData) {
                const f = findMatch(wardData);
                results[targetWardPath.toLowerCase().includes('metro') ? 'metro_ward' : 'municipal_ward'] = f ? f.properties : null;
            }
        }
    }

    return results;
}

module.exports = { getConstituencies, getEnrichedSpatialData };
