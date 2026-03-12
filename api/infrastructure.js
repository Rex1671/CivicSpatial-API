const { getEnrichedSpatialData } = require('../services/spatial');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

    try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        const enrichedData = await getEnrichedSpatialData(latitude, longitude, null, false);

        return res.status(200).json({
            success: true,
            infrastructure: {
                police_station: enrichedData.police_station,
                highway: enrichedData.highway,
                railway: enrichedData.railway
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
