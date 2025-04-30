// Constants
const EARTH_EQUATOR_LENGTH = 40075; // km
const MIN_DISTANCE_FOR_CITIES = 1; // Minimum distance to fetch cities (km)
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13); // Default: London

// Add OpenStreetMap base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables
let startMarker = null;
let bufferLayer = null;
let circleLayer = null;

// UI elements
const distanceInput = document.getElementById('distance');
const clearButton = document.getElementById('clear');
const currentDistanceSpan = document.getElementById('current-distance');
const areaSpan = document.getElementById('area');
const equatorStatsSpan = document.getElementById('equator-stats');
const planetTooSmallAlert = document.getElementById('planet-too-small');
const citiesListContainer = document.getElementById('cities-list');
const citiesList = document.getElementById('cities');
const loader = document.getElementById('loader');

// Map click handler
map.on('click', function(e) {
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    
    startMarker = L.marker(e.latlng, {
        draggable: true
    }).addTo(map);
    
    startMarker.on('drag', updateBuffer);
    updateBuffer();
});

// Update buffer and stats
async function updateBuffer() {
    if (!startMarker) return;

    showLoader();
    hideCitiesList();

    const distance = parseFloat(distanceInput.value);
    currentDistanceSpan.textContent = distance;

    const isPlanetTooSmall = distance > EARTH_EQUATOR_LENGTH / 2;
    planetTooSmallAlert.classList.toggle('d-none', !isPlanetTooSmall);

    const equatorRatio = distance / EARTH_EQUATOR_LENGTH;
    equatorStatsSpan.textContent = `That's ${equatorRatio.toFixed(3)}× the Earth's equator!`;

    if (bufferLayer) map.removeLayer(bufferLayer);
    if (circleLayer) map.removeLayer(circleLayer);

    if (isPlanetTooSmall) {
        hideLoader();
        return;
    }

    const center = startMarker.getLatLng();
    const point = turf.point([center.lng, center.lat]);
    
    
    const buffered = turf.buffer(point, distance, { units: 'kilometers' });

    bufferLayer = L.geoJSON(buffered, {
        style: {
            color: '#3388ff',
            weight: 2,
            fillColor: '#3388ff',
            fillOpacity: 0.2
        }
    }).addTo(map);

    
    circleLayer = L.circle(center, {
        radius: distance * 1000,
        color: '#3388ff',
        weight: 2,
        fillOpacity: 0.1
    }).addTo(map);

    const area = turf.area(buffered) / 1000000;
    areaSpan.textContent = area.toFixed(2);

    if (distance >= MIN_DISTANCE_FOR_CITIES) {
        try {
            const cities = await fetchCitiesInBuffer(buffered);
            displayCities(cities);
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            hideLoader();
        }
    } else {
        hideLoader();
    }

    map.fitBounds(bufferLayer.getBounds());
}

// Fetch cities from Overpass API
async function fetchCitiesInBuffer(geojsonBuffer) {
    const bounds = turf.bbox(geojsonBuffer);
    const query = `
        [out:json];
        (
            node["place"~"city|town|village"](${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]});
            way["place"~"city|town|village"](${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]});
            relation["place"~"city|town|village"](${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]});
        );
        out body;
        >;
        out skel qt;
    `;

    const response = await fetch(`${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.elements || [];
}

// Display cities list
function displayCities(cities) {
    citiesList.innerHTML = '';
    
    if (!cities || cities.length === 0) {
        hideCitiesList();
        return;
    }

    // Sort by population (if available)
    cities.sort((a, b) => {
        const popA = parseInt(a.tags?.population || 0);
        const popB = parseInt(b.tags?.population || 0);
        return popB - popA;
    });

    // Add cities to list (max 20)
    cities.slice(0, 20).forEach(city => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = city.tags?.name || `Unnamed (${city.id})`;
        citiesList.appendChild(li);
    });

    showCitiesList();
}

// UI helper functions
function showLoader() {
    loader.classList.remove('d-none');
}

function hideLoader() {
    loader.classList.add('d-none');
}

function showCitiesList() {
    citiesListContainer.classList.remove('d-none');
}

function hideCitiesList() {
    citiesListContainer.classList.add('d-none');
}

// Event listeners
distanceInput.addEventListener('input', updateBuffer);
clearButton.addEventListener('click', clearMap);

function clearMap() {
    if (startMarker) map.removeLayer(startMarker);
    if (bufferLayer) map.removeLayer(bufferLayer);
    if (circleLayer) map.removeLayer(circleLayer);
    
    startMarker = null;
    bufferLayer = null;
    circleLayer = null;
    
    areaSpan.textContent = '0';
    equatorStatsSpan.textContent = '';
    planetTooSmallAlert.classList.add('d-none');
    hideCitiesList();
    hideLoader();
}