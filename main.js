// main.js

async function loadMarkers() {
  const container = document.getElementById("map-container");
  const people = await fetch("people.json").then(res => res.json());

  const countryCounts = {};

  for (const p of people) {
    const div = document.createElement("div");
    div.className = "marker";
    div.style.top = p.top;
    div.style.left = p.left;
    div.dataset.timezone = p.timezone;

    const peopleCount = p.name.split("<br>").length;
    countryCounts[p.flag] = (countryCounts[p.flag] || 0) + peopleCount;

    div.innerHTML = `
      <div class="circle-flag-wrapper">
        <div class="tooltip">Click to view</div>
        <div class="circle-flag">
          <img class="flag" src="flags/${p.flag}.png" alt="${p.flag} flag" />
        </div>
        <div class="count"><span>${peopleCount}</span></div>
      </div>
      <div class="details">
        <button class="close-btn">&times;</button>
        ${p.name}<br />
        <div class="time-box">
          <span class="time">--:--:--</span>
        </div>
      </div>
    `;

    div.addEventListener("click", e => {
      if (e.target.closest(".close-btn")) return;
      e.stopPropagation();

      document.querySelectorAll(".marker").forEach(m => {
        if (m !== div) m.classList.remove("open", "active", "details-up");
      });

      const isOpen = div.classList.toggle("open");

      if (isOpen) {
        div.classList.add("active");
        const markerRect = div.getBoundingClientRect();
        const mapRect = container.getBoundingClientRect();
        if (markerRect.top - mapRect.top < 100) {
          div.classList.add("details-up");
        } else {
          div.classList.remove("details-up");
        }
      } else {
        div.classList.remove("active", "details-up");
      }
    });

    div.querySelector(".close-btn").addEventListener("pointerup", e => {
      e.stopPropagation();
      div.classList.remove("open", "active", "details-up");
    });

    container.appendChild(div);
  }

  const list = document.getElementById("country-list");
  let total = 0;
  Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([flag, count]) => {
      total += count;
      const li = document.createElement("li");
      li.innerHTML = `
        <span><img src="flags/${flag}.png" alt="${flag}" style="width: 16px; vertical-align: middle;"> ${flag.toUpperCase()}</span>
        <span>${count}</span>
      `;
      list.appendChild(li);
    });

  const totalLi = document.createElement("li");
  totalLi.className = "country-total";
  totalLi.innerHTML = `<strong>Total</strong><strong>${total}</strong>`;
  list.appendChild(totalLi);
}

function updateUTCTime() {
  const now = new Date();
  const utc = now.toUTCString().split(" ")[4];
  document.getElementById("utc-time").textContent = utc + " UTC";
}

function updateLocalTimes() {
  document.querySelectorAll(".marker").forEach(marker => {
    const tz = marker.dataset.timezone;
    try {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(new Date());
      const timeEl = marker.querySelector(".time");
      if (timeEl) timeEl.textContent = formatted;
    } catch (e) {
      console.error("Timezone error:", tz, e);
    }
  });
}

function updateDayNightShading() {
  const canvas = document.getElementById('dayNightCanvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, width, height);
  const now = new Date();
  const latMin = -90, latMax = 90;
  const lonMin = -180, lonMax = 180;
  const step = 1;
  const twilightCutoff = -11 * (Math.PI / 180);
  for (let y = 0; y < height; y += step) {
    const lat = latMax - (y / height) * (latMax - latMin);
    for (let x = 0; x < width; x += step) {
      const lon = lonMin + (x / width) * (lonMin - lonMax);
      const sunPos = SunCalc.getPosition(now, lat, lon);
      if (sunPos.altitude < twilightCutoff) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y, step, step);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMarkers();
  document.addEventListener("click", () => {
    document.querySelectorAll(".marker.open").forEach(m => {
      m.classList.remove("open", "active", "details-up");
    });
  });
  updateUTCTime();
  setInterval(updateUTCTime, 1000);
  updateLocalTimes();
  setInterval(updateLocalTimes, 1000);
  updateDayNightShading();
  setInterval(updateDayNightShading, 300000);

  setTimeout(() => {
    panzoom(document.getElementById("map-container"), {
      maxZoom: 5,
      minZoom: 1,
      bounds: true,
      boundsPadding: 0.1,
      exclude: Array.from(document.querySelectorAll('.marker'))
    });
  }, 500);
});
