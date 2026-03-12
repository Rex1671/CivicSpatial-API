// Initialize the Map centered on India (Geographic Center approx 20.5937° N, 78.9629° E)
const map = L.map('map').setView([20.5937, 78.9629], 5); // Zoom level 5 is good for entire country view

// Add a premium, modern map tile layer (CartoDB Positron for a clean, light look that makes markers pop)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Keep track of the current marker
let currentMarker = null;

// DOM Elements
const resultCard = document.getElementById('result-card');
const loadingDiv = document.getElementById('loading');
const contentDiv = document.getElementById('content');
const errorDiv = document.getElementById('error-message');

const els = {
    state: document.getElementById('res-state'),
    district: document.getElementById('res-district'),
    subdistrict: document.getElementById('res-subdistrict'),
    municipality: document.getElementById('res-municipality'),
    panchayat: document.getElementById('res-panchayat'),
    pincode: document.getElementById('res-pincode'),
    metroward: document.getElementById('res-metroward'),
    metroRow: document.getElementById('metro-ward-row'),
    mp: document.getElementById('res-mp'),
    mla: document.getElementById('res-mla'),
    police: document.getElementById('res-police'),
    highway: document.getElementById('res-highway'),
    railway: document.getElementById('res-railway'),
    wikiContainer: document.getElementById('wiki-insight'),
    wikiImg: document.getElementById('res-wiki-img'),
    wikiTitle: document.getElementById('res-wiki-title'),
    wikiDesc: document.getElementById('res-wiki-desc'),
    wikiExtract: document.getElementById('res-wiki-extract'),
    toggleInfra: document.getElementById('toggle-infra'),
    infraContent: document.getElementById('infra-content')
};

const formatValue = (val, dist, suffix = '') => {
    if (!val) return 'Not found';
    let html = val + suffix;
    if (dist !== undefined && dist !== null) {
        html += ` <span class="badge badge-distance">${dist} km</span>`;
    }
    return html;
};

// Toggle Infra Details
els.toggleInfra.addEventListener('click', () => {
    const isHidden = els.infraContent.classList.toggle('hidden');
    els.toggleInfra.textContent = isHidden ? 'Show Details' : 'Hide Details';
});

// Map Click Listener
map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Drop new marker
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lon]).addTo(map);

    // Show loading state in UI
    resultCard.classList.remove('hidden');
    contentDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const [jurRes, elecRes, wardRes, infraRes] = await Promise.all([
            fetch(`/api/jurisdiction?lat=${lat}&lon=${lon}`),
            fetch(`/api/electoral?lat=${lat}&lon=${lon}`),
            fetch(`/api/wards?lat=${lat}&lon=${lon}`),
            fetch(`/api/infrastructure?lat=${lat}&lon=${lon}`)
        ]);
        
        const jurData = await jurRes.json();
        const elecData = await elecRes.json();
        const wardData = await wardRes.json();
        const infraData = await infraRes.json();

        loadingDiv.classList.add('hidden');
        contentDiv.classList.remove('hidden');

        if (!jurRes.ok || jurData.error || !elecRes.ok || elecData.error || !wardRes.ok || wardData.error || !infraRes.ok || infraData.error) {
            errorDiv.textContent = jurData.error || elecData.error || wardData.error || infraData.error || 'Failed to fetch data.';
            errorDiv.classList.remove('hidden');
            return;
        }

        const jrn = jurData.jurisdiction || {};
        const reps = elecData.representatives || {};
        const infra = infraData.infrastructure || {};
        const metro = wardData.metro_data;
        const wiki = jurData.insights;
        
        // Update Jurisdiction DOM
        els.state.textContent = jrn.state || 'Not found';
        els.district.textContent = jrn.district_zila_parishad || jrn.district || 'Not found';
        els.subdistrict.textContent = jrn.sub_district || 'Not found';
        els.municipality.textContent = jrn.municipality_corporation || jrn.municipality || 'Not found';
        els.panchayat.textContent = jrn.local_body_panchayat_ward || jrn.locality || 'Not found';
        els.pincode.textContent = jrn.pincode || 'Not found';
        
        // Handle Metro Ward Visibility
        if (metro) {
            els.metroRow.classList.remove('hidden');
            els.metroward.textContent = `${metro.Name || metro.ward_name || metro.ward || 'Unnamed Ward'} (${metro.Zone || metro.zone || 'No Zone'})`;
        } else {
            els.metroRow.classList.add('hidden');
        }
        
        // Update Electoral DOM
        els.mp.textContent = reps.mp ? `${reps.mp.name} (${reps.mp.category || 'General'})` : 'Outside defined geometry';
        els.mla.textContent = reps.mla ? `${reps.mla.name} (${reps.mla.no || '-'})` : 'Outside defined geometry';

        // Update Infrastructure DOM
        els.police.innerHTML = formatValue(infra.police_station?.properties?.ps, infra.police_station?.distance_km);
        els.highway.innerHTML = formatValue(infra.highway?.properties?.Name, infra.highway?.distance_km);
        els.railway.innerHTML = formatValue(infra.railway?.properties?.STT_NME, infra.railway?.distance_km, ' Railway Line');

        // Update Wikipedia Insights DOM
        if (wiki) {
            els.wikiContainer.classList.remove('hidden');
            els.wikiTitle.textContent = wiki.title || 'Insight';
            els.wikiDesc.textContent = wiki.description || '';
            els.wikiExtract.textContent = wiki.extract || '';
            
            if (wiki.thumbnail) {
                els.wikiImg.src = wiki.thumbnail;
                els.wikiImg.style.display = 'block';
            } else {
                els.wikiImg.style.display = 'none';
            }
        } else {
            els.wikiContainer.classList.add('hidden');
        }

    } catch (err) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'Network or server error occurred.';
        errorDiv.classList.remove('hidden');
    }
});
