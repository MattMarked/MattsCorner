# Coordinate Shifting Feature

This document explains the coordinate shifting functionality implemented in the restaurant mapping application.

## Overview

All restaurant coordinates are automatically shifted 171 meters eastward before being stored in the database and displayed on the map. This applies to:

- All newly geocoded restaurant locations
- Fallback coordinates (Dublin city center)
- Any coordinate extracted from Google Maps URLs

## How It Works

### 1. Geocoding API (`/api/geocode`)
Every coordinate returned from the geocoding API is automatically shifted eastward using the configured distance (default: 171 meters).

### 2. Coordinate Calculation
At Dublin's latitude (~53.35°), 171 meters east equals approximately +0.002467 degrees longitude:

```javascript
// Conversion formula
const latitudeRadians = coords.lat * (Math.PI / 180);
const metersPerDegreeLongitude = 111320 * Math.cos(latitudeRadians);
const longitudeShift = metersEast / metersPerDegreeLongitude;
```

### 3. Affected Components
- **Geocode API**: All coordinate extraction patterns
- **Parser**: Dublin center fallback coordinates
- **Database**: Migration function for existing coordinates
- **Map Display**: Shows shifted positions

## Configuration

The coordinate shifting feature can be controlled via environment variables:

```bash
# Enable/disable coordinate shifting (default: enabled)
COORDINATE_SHIFT_ENABLED=true

# Distance in meters to shift eastward (default: 171)
COORDINATE_EAST_SHIFT_METERS=171
```

### Disabling the Feature
To disable coordinate shifting, set in your `.env.local`:
```bash
COORDINATE_SHIFT_ENABLED=false
```

### Adjusting Shift Distance
To change the eastward shift distance:
```bash
COORDINATE_EAST_SHIFT_METERS=300  # 300 meters instead of 171
```

## Database Migration

For existing restaurants with coordinates already in the database, use the migration function:

```javascript
const repository = new RestaurantRepository();
const result = repository.migrateCoordinatesEastward();
console.log(`Updated: ${result.updated}, Skipped: ${result.skipped}`);
```

This will:
- Apply the configured eastward shift to all existing coordinates
- Skip restaurants without coordinates
- Log each coordinate transformation
- Return statistics about the migration

## Testing

Run the test script to verify coordinate shifting calculations:

```bash
node scripts/test-coordinate-shift.js
```

This will show:
- Sample coordinate transformations
- Expected longitude differences
- Verification of the ~0.002467 degree shift at Dublin's latitude

## Files Modified

### Core Implementation
- `src/lib/coordinates.ts` - Main coordinate shifting logic
- `src/app/api/geocode/route.ts` - Apply shift to all geocoding results
- `src/lib/parser.ts` - Apply shift to fallback coordinates
- `src/lib/database.ts` - Migration function for existing data

### Configuration
- `.env.example` - Environment variable documentation
- `scripts/test-coordinate-shift.js` - Testing and verification

## Example Transformation

```
Original Dublin coordinates:
Trinity College: (53.344430, -6.254440)

After 171m eastward shift:
Trinity College: (53.344430, -6.251973)

Difference: +0.002467 degrees longitude (≈171 meters east)
```

## Verification

To verify the feature is working:

1. **Check Logs**: Look for coordinate shift messages in the console
2. **Database Inspection**: Compare original vs shifted coordinates
3. **Map Visualization**: All markers should appear ~171m east of actual locations
4. **API Testing**: Test the `/api/geocode` endpoint with sample URLs

## Important Notes

- ⚠️ **All coordinates are shifted**: This affects every restaurant location
- 🧭 **Eastward direction**: Longitude increases (moves right on map)
- 📍 **Consistent application**: Applied to all coordinate sources uniformly
- 🔄 **Migration required**: Existing data needs manual migration
- 🎛️ **Configurable**: Can be disabled or adjusted via environment variables

## Technical Details

The coordinate shifting uses standard geographic calculations accounting for Earth's curvature at Dublin's specific latitude. The implementation is designed to be:

- **Accurate**: Precise meter-to-degree conversion
- **Consistent**: Applied uniformly across all coordinate sources  
- **Configurable**: Environment-based configuration
- **Reversible**: Original coordinates can be calculated if needed
- **Logged**: All transformations are logged for debugging

For questions or issues with coordinate shifting, refer to the console logs which show detailed transformation information for each restaurant location.
