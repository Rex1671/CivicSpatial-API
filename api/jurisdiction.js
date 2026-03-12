const { getIndianJurisdiction } = require('../services/geocoding');
const { getWikipediaData } = require('../services/wikipedia');
const { getEnrichedSpatialData } = require('../services/spatial');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Please provide valid lat and lon query parameters' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'lat and lon must be valid numbers' });
    }

    try {
        // 1. Get Jurisdiction via BigDataCloud/Nominatim
        const jurResult = await getIndianJurisdiction(latitude, longitude);
        if (jurResult.error) {
            return res.status(400).json(jurResult);
        }

        const jrn = jurResult.jurisdiction;

        // 2. Get Wikipedia data and Sub-district concurrently
        const [wikiData, enrichedData] = await Promise.all([
            getWikipediaData([
                jrn.city,
                jrn.locality,
                jrn.municipality_corporation,
                jrn.district_zila_parishad,
                jrn.state
            ].filter(Boolean)),
            getEnrichedSpatialData(latitude, longitude, jrn.city || jrn.locality, false)
        ]);

        return res.status(200).json({
            success: true,
            jurisdiction: {
                ...jrn,
                sub_district: enrichedData.sub_district?.subdtname || enrichedData.sub_district?.SDTNAME || enrichedData.sub_district?.SUBDIST_NA,
                pincode: enrichedData.pincode?.Pincode || enrichedData.pincode?.pincode || jrn.pincode
            },
            insights: wikiData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};
