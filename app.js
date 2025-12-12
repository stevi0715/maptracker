const map = L.map('map').setView([53.553, -1.482], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const speedDisplay = document.getElementById('speed');
const limitDisplay = document.getElementById('limit');

function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert-banner';
  alertBox.innerText = message;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}

let cameras = [];
fetch('barnsley-cameras.json')
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

let carMarker;
let followMe = true;

const followBtn = document.createElement('button');
followBtn.innerText = "Follow Me: ON";
followBtn.style.position = "absolute";
followBtn.style.top = "10px";
followBtn.style.right = "10px";
followBtn.style.zIndex = "1000";
document.body.appendChild(followBtn);

followBtn.addEventListener('click', () => {
  followMe = !followMe;
  followBtn.innerText = followMe ? "Follow Me: ON" : "Follow Me: OFF";
});

map.locate({ watch: true, setView: true, maxZoom: 16 });

map.on('locationfound', e => {
  if (carMarker) {
    carMarker.setLatLng(e.latlng);
  } else {
    carMarker = L.marker(e.latlng, {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61113.png',
        iconSize: [32, 32]
      })
    }).addTo(map).bindPopup("You are here");
  }

  if (followMe) {
    map.setView(e.latlng, 16);
  }

  let speedMph;
  if (e.speed) {
    speedMph = (e.speed * 2.23694).toFixed(0);
  } else if (e.coords && e.coords.speed) {
    speedMph = (e.coords.speed * 2.23694).toFixed(0);
  }

  if (speedMph) {
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

  cameras.forEach(cam => {
    const distance = map.distance(e.latlng, L.latLng(cam.lat, cam.lng));
    if (distance < 500) {
      showAlert(`⚠️ Speed camera ahead on ${cam.road} (${cam.type})!`);
    }
  });
});
