# Milestone 8: Geolocation & Maps

**Duration:** Week 11  
**Goal:** Location-based search and display

## Progress: 0/13 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Add PostGIS extension
- [ ] Add location_coordinates (geography type)
- [ ] Create spatial indexes
- [ ] Implement proximity search

### Frontend
- [ ] Location picker component (department + city dropdowns)
- [ ] Optional: GPS coordinates capture from browser
- [ ] Optional: Map display (if coordinates available)
- [ ] Display product location on detail page (city-level only)
- [ ] Filter by department/city
- [ ] Filter by distance radius (if user shares location)
- [ ] Show nearby products
- [ ] Bolivia-specific: 9 departments, major cities pre-loaded

### Backend
- [ ] Geocoding (city name → coordinates)
- [ ] Distance calculation
- [ ] Proximity sorting

## Deliverables
- ✅ Location-based features
- ✅ Proximity search

## Success Criteria
- Users can set location on products
- Map displays product location
- Can search by distance (e.g., "within 5km")
- Nearby products show correctly
- Geocoding works for Bolivian cities
- Distance calculations are accurate

## Dependencies
- M2 completed (products)
- PostGIS extension available

## Notes
- Use PostGIS for geospatial queries
- Support 9 Bolivian departments (Santa Cruz, La Paz, Cochabamba, etc.)
- Pre-load major cities per department
- Use Leaflet or Mapbox for maps (optional)
- Store coordinates as geography type (optional field)
- Implement radius search (5km, 10km, 25km, 50km options)
- Consider mobile data usage (maps are optional)
- Privacy: Never show exact coordinates publicly
- Show city-level location only
- Three capture methods: Manual (default), GPS (optional), IP geolocation (fallback)
