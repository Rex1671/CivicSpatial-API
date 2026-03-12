const axios = require('axios');


async function getWikipediaData(placeNames) {
    if (!placeNames || !placeNames.length) return null;

    for (const place of placeNames) {
        const cleanName = place
            .replace(/ district$/i, '')
            .replace(/ Municipality$/i, '')
            .replace(/ Corporation$/i, '')
            .replace(/Ward /i, '')
            .trim();

        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'IndianJurisdictionApp/2.0 (test@example.com)' }
            });
            
            if (response.data.type !== 'disambiguation') {
                return {
                    title: response.data.title,
                    description: response.data.description, 
                    extract: response.data.extract,         
                    thumbnail: response.data.thumbnail ? response.data.thumbnail.source : null,
                    article_url: response.data.content_urls ? response.data.content_urls.desktop.page : null,
                    matched_on: cleanName
                };
            }
        } catch (error) {
        }
    }
    
    return null;
}

module.exports = { getWikipediaData };
