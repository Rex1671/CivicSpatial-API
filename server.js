const express = require('express');
const cors = require('cors');
const { getIndianJurisdiction } = require('./services/geocoding');
const { getConstituencies, getEnrichedSpatialData } = require('./services/spatial');
const { getWikipediaData } = require('./services/wikipedia');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

const getRepresentativesVercel = require('./api/representatives');
const getWardsVercel = require('./api/wards');
const getInfrastructureVercel = require('./api/infrastructure');
const getJurisdictionVercel = require('./api/jurisdiction');
const getElectoralVercel = require('./api/electoral');

app.get('/api/representatives', getRepresentativesVercel);
app.get('/api/wards', getWardsVercel);
app.get('/api/infrastructure', getInfrastructureVercel);
app.get('/api/jurisdiction', getJurisdictionVercel);
app.get('/api/electoral', getElectoralVercel);
app.get('/api/health', (req, res) => res.json({ status: 'ok', local: true }));

app.get('/api/place-data', async (req, res) => {
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
        const jurResult = await getIndianJurisdiction(latitude, longitude);
        if (jurResult.error) {
            return res.status(400).json(jurResult);
        }

        const jrn = jurResult.jurisdiction;

        const electoralData = await getConstituencies(latitude, longitude);

        const enrichedData = await getEnrichedSpatialData(latitude, longitude, jrn.city || jrn.locality);

        const searchTerms = [
            jrn.city,
            jrn.locality,
            jrn.municipality_corporation,
            jrn.district_zila_parishad,
            jrn.state
        ].filter(Boolean);
        
        const wikiData = await getWikipediaData(searchTerms);

        return res.json({
            success: true,
            jurisdiction: {
                ...jrn,
                sub_district: enrichedData.sub_district?.subdtname || enrichedData.sub_district?.SDTNAME || enrichedData.sub_district?.SUBDIST_NA,
                pincode: enrichedData.pincode?.Pincode || enrichedData.pincode?.pincode || jrn.pincode
            },
            representatives: electoralData,
            infrastructure: {
                police_station: enrichedData.police_station,
                highway: enrichedData.highway,
                railway: enrichedData.railway
            },
            metro_data: enrichedData.metro_ward || enrichedData.municipal_ward,
            insights: wikiData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}/api/jurisdiction?lat=19.0760&lon=72.8777`);
});
