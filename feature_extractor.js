// feature_extractor.js
// WP7.1 - Extract features from trip JSON files and save to CSV

const fs = require("fs");
const { writeToPath } = require("fast-csv");

// --- Feature extraction logic ---
function extractFeatures(session) {
  const speeds = [];
  const accelerations = session.points.map(p => p.acceleration);

  for (let i = 1; i < session.points.length; i++) {
    const prev = session.points[i - 1];
    const curr = session.points[i];

    const dt = (new Date(curr.timestamp) - new Date(prev.timestamp)) / 1000; // sec
    if (dt > 0) {
      const dx = curr.latitude - prev.latitude;
      const dy = curr.longitude - prev.longitude;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111; // rough km
      const speed = (distance / dt) * 3600; // km/h
      speeds.push(speed);
    }
  }

  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length ? Math.max(...speeds) : 0;
  const avgAccel = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
  const maxAccel = Math.max(...accelerations);
  const minAccel = Math.min(...accelerations);

  return {
    sessionId: session.sessionId,
    driverId: session.driverId,
    vehicleId: session.vehicleId,
    durationSec: session.durationSec,
    distanceKm: session.distanceKm,
    avgSpeed: avgSpeed.toFixed(2),
    maxSpeed: maxSpeed.toFixed(2),
    avgAccel: avgAccel.toFixed(2),
    maxAccel: maxAccel.toFixed(2),
    minAccel: minAccel.toFixed(2)
  };
}

// --- MAIN: read all trip JSON files one folder up ---
function main() {
  const folder = "../"; // look in parent folder
  const tripFiles = fs.readdirSync(folder)
    .filter(f => f.startsWith("trip") && f.endsWith(".json"));

  if (tripFiles.length === 0) {
    console.error("❌ No trip JSON files found in parent folder.");
    return;
  }

  const allFeatures = [];

  for (const file of tripFiles) {
    try {
      const session = JSON.parse(fs.readFileSync(`${folder}${file}`, "utf8"));
      const features = extractFeatures(session);
      allFeatures.push(features);
      console.log(`✅ Processed ${file}`);
    } catch (err) {
      console.error(`❌ Error reading ${file}:`, err.message);
    }
  }

  writeToPath("features.csv", allFeatures, { headers: true })
    .on("finish", () => console.log("🎉 Feature extraction complete: features.csv"))
    .on("error", err => console.error("CSV Write Error:", err));
}

main();
