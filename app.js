// Initialize map
const map = L.map('map').setView([53.553, -1.482], 12);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Speed and limit display
const speedDisplay = document.getElementById('speed');
const limitDisplay = document.getElementById('limit');

// Alert banner
function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert-banner';
  alertBox.innerText = message;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}

// Load cameras from JSON
let cameras = [];
fetch('south-yorkshire-cameras.json')
  .then(res => res.json())
  .then(data => {
    cameras = data;
    cameras.forEach(cam => {
      L.marker([cam.lat, cam.lng])
        .addTo(map)
        .bindPopup(`Camera: ${cam.type} | Road: ${cam.road} | Limit: ${cam.limit} mph`);
    });
  })
  .catch(err => console.error("Error loading cameras:", err));

// Track user location continuously
let carMarker;
map.locate({ watch: true, setView: true, maxZoom: 16 });

map.on('locationfound', e => {
  // Update or create car marker
  if (carMarker) {
    carMarker.setLatLng(e.latlng);
  } else {
    carMarker = L.marker(e.latlng, { icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61113.png',
      iconSize: [32, 32]
    })}).addTo(map).bindPopup("You are here");
  }

  // Speed display in MPH
  if (e.speed) {
    const speedMph = (e.speed * 2.23694).toFixed(0);
    speedDisplay.innerText = `Speed: ${speedMph} mph`;

    const limitText = limitDisplay.innerText.replace(/[^0-9]/g, '');
    const limitMph = parseInt(limitText, 10);

    if (speedMph > limitMph) {
      speedDisplay.classList.add('over-limit');
    } else {
      speedDisplay.classList.remove('over-limit');
    }
  } else {
    speedDisplay.innerText = "Speed: unavailable";
    speedDisplay.classList.remove('over-limit');
  }

  // Check proximity to cameras
  cameras.forEach(cam => {
    const distance = map.distance(e.latlng, L.latLng(cam.lat, cam.lng));
    if (distance < 500) {
      showAlert(`⚠️ Speed camera ahead on ${cam.road} (${cam.type})!`);
    }
  });
});
fetch('barnsley-cameras.json')
  .then(res => res.json())
  .then(data => {
    cameras = data;
    console.log("Loaded cameras:", cameras); // check console
    cameras.forEach(cam => {
      L.marker([cam.lat, cam.lng])
        .addTo(map)
        .bindPopup(`Camera: ${cam.type} | Road: ${cam.road} | Limit: ${cam.limit} mph`);
    });
  })
  .catch(err => console.error("Error loading cameras:", err));
