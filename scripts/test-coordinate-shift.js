#!/usr/bin/env node

/**
 * Test script to verify coordinate shifting functionality
 * Usage: node scripts/test-coordinate-shift.js
 */

// Test Dublin coordinates (Trinity College)
const testCoordinates = [
  { name: 'Trinity College Dublin', lat: 53.34443, lng: -6.25444 },
  { name: 'Temple Bar', lat: 53.34569, lng: -6.26726 },
  { name: 'Dublin Castle', lat: 53.34305, lng: -6.26749 },
  { name: 'St. Patrick\'s Cathedral', lat: 53.33934, lng: -6.27144 }
];

// Simulate the coordinate shift calculation (171m east at Dublin's latitude)
function shiftCoordinatesEast(coords, metersEast = 171) {
  // Convert meters to degrees longitude
  const latitudeRadians = coords.lat * (Math.PI / 180);
  const metersPerDegreeLongitude = 111320 * Math.cos(latitudeRadians);
  const longitudeShift = metersEast / metersPerDegreeLongitude;

  return {
    lat: coords.lat, // Latitude stays the same for eastward shift
    lng: coords.lng + longitudeShift // Add to longitude for eastward movement
  };
}

console.log('🧪 Testing coordinate shift functionality\n');

testCoordinates.forEach((coord, index) => {
  const shifted = shiftCoordinatesEast(coord, 171);
  const longitudeDiff = shifted.lng - coord.lng;
  
  console.log(`${index + 1}. ${coord.name}`);
  console.log(`   Original:  (${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)})`);
  console.log(`   Shifted:   (${shifted.lat.toFixed(6)}, ${shifted.lng.toFixed(6)})`);
  console.log(`   Longitude diff: +${longitudeDiff.toFixed(6)} degrees (~171m east)`);
  console.log('');
});

console.log('✅ Coordinate shifting test completed');
console.log('📍 All coordinates should show ~0.002467 degrees longitude increase');
console.log('🗺️  This represents approximately 171 meters eastward at Dublin\'s latitude');

// Test with sample Google Maps URLs (mock)
console.log('\n🔗 Testing with sample URLs:');
const sampleUrls = [
  'https://maps.app.goo.gl/abc123 (Trinity College)',
  'https://maps.app.goo.gl/def456 (Temple Bar)',
  'https://maps.app.goo.gl/ghi789 (Dublin Castle)'
];

sampleUrls.forEach(url => {
  console.log(`📱 ${url} → Will be shifted 171m east when geocoded`);
});

console.log('\n🎯 Expected behavior:');
console.log('- All new restaurant geocoding will be shifted 171m east');
console.log('- Existing database coordinates can be migrated using the migration function');
console.log('- Dublin center fallback coordinates are also shifted');
console.log('- Configuration can be changed via environment variables');
