const axios = require('axios');


async function getIndianJurisdiction(lat, lon) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    try {
        const response = await axios.get(url);
        const data = response.data;
        
        let jurisdiction = {
            state: null,
            district_zila_parishad: null,
            municipality_corporation: null,
            local_body_panchayat_ward: null,
            city: data.city || null,
            locality: data.locality || null,
            raw_country: data.countryName
        };

        if (data.countryCode !== 'IN') {
            return { error: 'Coordinates are not in India', data: jurisdiction };
        }

        const admin = data.localityInfo?.administrative || [];
        
        for (const ad of admin) {
            if (ad.adminLevel === 4) jurisdiction.state = ad.name;
            if (ad.adminLevel === 5 && ad.name.toLowerCase().includes('district')) jurisdiction.district_zila_parishad = ad.name;
            if ((ad.adminLevel === 5 && !ad.name.toLowerCase().includes('district')) || ad.adminLevel === 6) jurisdiction.municipality_corporation = ad.name;
            if ([7, 8, 9, 10].includes(ad.adminLevel)) jurisdiction.local_body_panchayat_ward = ad.name;
        }

  
        try {
            const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18`;
            const nomRes = await axios.get(nomUrl, {
                headers: { 'User-Agent': 'IndianJurisdictionApp/1.0 (local-test)' }
            });
            
            if (nomRes.data && nomRes.data.address) {
                const add = nomRes.data.address;
                const panchayatProxy = add.village || add.hamlet || add.suburb || add.neighbourhood || add.town;
                
                if (panchayatProxy && (!jurisdiction.local_body_panchayat_ward || add.village)) {
                    jurisdiction.local_body_panchayat_ward = panchayatProxy + (add.village ? ' (Village/Panchayat)' : ' (Ward/Locality)');
                }
            }
        } catch (nomErr) {
            console.warn('Nominatim fallback failed:', nomErr.message);
        }

        return { success: true, jurisdiction };
    } catch (error) {
        console.error('Error fetching geocoding data:', error.message);
        throw new Error('Failed to reverse geocode coordinates');
    }
}

module.exports = { getIndianJurisdiction };
