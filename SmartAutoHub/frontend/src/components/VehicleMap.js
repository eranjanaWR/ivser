// Force map to recalculate size after results are loaded
import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import styles from './VehicleMap.module.css'

// Approximate lat/lng for major Sri Lankan cities
const CITY_COORDS = {
    'colombo': [6.9271, 79.8612],
    'kandy': [7.2906, 80.6337],
    'galle': [6.0535, 80.2210],
    'jaffna': [9.6615, 80.0255],
    'negombo': [7.2096, 79.8384],
    'trincomalee': [8.5874, 81.2152],
    'batticaloa': [7.7172, 81.7006],
    'anuradhapura': [8.3114, 80.4037],
    'polonnaruwa': [7.9403, 81.0188],
    'ratnapura': [6.6828, 80.3992],
    'kurunegala': [7.4863, 80.3647],
    'matara': [5.9549, 80.5550],
    'hambantota': [6.1241, 81.1185],
    'nuwara eliya': [6.9497, 80.7891],
    'badulla': [6.9934, 81.0550],
    'ampara': [7.2999, 81.6724],
    'kalmunai': [7.4167, 81.8167],
    'vavuniya': [8.7514, 80.4997],
    'mannar': [8.9802, 79.9024],
    'matale': [7.4675, 80.6234],
    'kalutara': [6.5854, 79.9607],
    'gampaha': [7.0917, 80.0000],
    'puttalam': [8.0362, 79.8283],
    'kilinochchi': [9.3803, 80.4005],
    'mullaitivu': [9.2673, 80.8138],
    'monaragala': [6.8728, 81.3506],
    'kegalle': [7.2510, 80.3464],
    'avissawella': [6.9478, 80.2125],
    'weligama': [5.9745, 80.4298],
    'dambulla': [7.8742, 80.6511],
    'panadura': [6.7128, 79.9018],
    'moratuwa': [6.7728, 79.8816],
    'dehiwala': [6.8480, 79.8740],
    'mount lavinia': [6.8320, 79.8652],
    'horana': [6.7157, 80.0607],
    'kotte': [6.8900, 79.9000],
    'kaduwela': [6.9281, 79.9835],
    'kelaniya': [7.0015, 79.9219],
    'ragama': [7.0425, 79.9230],
    'kadawatha': [7.0275, 79.9460],
    'maharagama': [6.8464, 79.9263],
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fix default icon path broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Try to get coordinates for a city, fallback to vehicle coordinates or Sri Lanka center
function getCoords(city, vehicle) {
    if (!city) return null;
    const key = city.toLowerCase().trim();
    if (CITY_COORDS[key]) return CITY_COORDS[key];
    // Try vehicle.location.coordinates if available and valid
    if (vehicle && vehicle.location && Array.isArray(vehicle.location.coordinates)) {
        const coords = vehicle.location.coordinates;
        // MongoDB GeoJSON: [lng, lat] but Leaflet wants [lat, lng]
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            // If both are not zero
            if (coords[0] !== 0 || coords[1] !== 0) {
                return [coords[1], coords[0]];
            }
        }
    }
    // Fallback: center of Sri Lanka
    return [7.8731, 80.7718];
}

export default function VehicleMap({ vehicles }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markersRef = useRef([])
    const userMarkerRef = useRef(null)
    const [userLoc, setUserLoc] = useState(null)
    const [isLocating, setIsLocating] = useState(false)

    // Build city → count map
    const cityGroups = {}
    vehicles.forEach(v => {
        const city = v.location?.city || v.city || 'Unknown';
        const coords = getCoords(city, v);
        if (!coords) return;
        if (!cityGroups[city]) cityGroups[city] = { count: 0, coords, city };
        cityGroups[city].count++;
    });
    const cityList = Object.values(cityGroups)

    useEffect(() => {
        if (!mapRef.current) return
        if (mapInstanceRef.current) return // already initialised

        // Centre on Sri Lanka
        const map = L.map(mapRef.current, {
            center: [7.8731, 80.7718],
            zoom: 7,
            zoomControl: true,
            attributionControl: false,
            scrollWheelZoom: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(map)

        mapInstanceRef.current = map

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    const handleGetLocation = () => {
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                const loc = [latitude, longitude]
                setUserLoc(loc)
                setIsLocating(false)

                const map = mapInstanceRef.current
                if (map) {
                    if (userMarkerRef.current) userMarkerRef.current.remove()

                    const userIcon = L.divIcon({
                        className: '',
                        html: `<div style="
                            width:18px;height:18px;
                            background:#3b82f6;
                            border:3px solid #fff;
                            border-radius:50%;
                            box-shadow:0 0 10px rgba(59,130,246,0.6);
                        "></div>`,
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    })

                    userMarkerRef.current = L.marker(loc, { icon: userIcon })
                        .addTo(map)
                        .bindTooltip('<b>Your Current Location</b>', { direction: 'top', className: 'slm-tooltip' })

                    map.setView(loc, 9)
                }
            },
            (err) => {
                console.error(err)
                setIsLocating(false)
                alert("Could not access your location. Please enable location services.")
            }
        )
    }

    // Update markers when cityList or userLoc changes
    useEffect(() => {
        const map = mapInstanceRef.current
        if (!map) return

        // Clear old markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        cityList.forEach(({ city, coords, count }) => {
            const size = Math.min(14 + count * 6, 46)

            // Calculate distance if user location is available
            let distanceText = ""
            if (userLoc) {
                const dist = calculateDistance(userLoc[0], userLoc[1], coords[0], coords[1])
                distanceText = `<br/><span style="color:#94a3b8;font-size:0.75rem;">${dist.toFixed(1)} km away</span>`
            }

            const icon = L.divIcon({
                className: '',
                html: `<div style="
            width:${size}px;height:${size}px;
            background:linear-gradient(135deg,#e63946,#c1121f);
            border:2.5px solid #fff;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:${size > 30 ? '11' : '9'}px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            cursor:pointer;
          ">${count}</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            })

            const marker = L.marker(coords, { icon })
                .addTo(map)
                .bindTooltip(`<b>${city}</b><br/>${count} vehicle${count > 1 ? 's' : ''}${distanceText}`, {
                    direction: 'top',
                    offset: [0, -(size / 2 + 4)],
                    className: 'slm-tooltip',
                })

            markersRef.current.push(marker)
        })
    }, [JSON.stringify(cityList), userLoc])

    const hasResults = vehicles.length > 0

    // Force map to recalculate size after results are loaded
    useEffect(() => {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.invalidateSize === 'function') {
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 200);
        }
    }, [hasResults]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    Vehicle Locations
                </div>
                {hasResults && (
                    <button
                        className={styles.locationBtn}
                        onClick={handleGetLocation}
                        disabled={isLocating}
                    >
                        {isLocating ? 'Locating...' : 'Distance from Me'}
                    </button>
                )}
            </div>

            {!hasResults ? (
                <div className={styles.empty}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <p>Search for vehicles to see<br />their locations on the map</p>
                </div>
            ) : (
                <>
                    <div className={styles.cityPills}>
                        {cityList.map(({ city, coords, count }) => {
                            let distVal = null
                            if (userLoc) {
                                distVal = calculateDistance(userLoc[0], userLoc[1], coords[0], coords[1])
                            }
                            return (
                                <span key={city} className={styles.pill}>
                                    📍 {city} <b>{count}</b>
                                    {distVal !== null && <span className={styles.distLabel}>{distVal.toFixed(0)}km</span>}
                                </span>
                            )
                        })}
                        {cityList.length === 0 && (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>No exact locations found for these results</p>
                        )}
                    </div>
                    <div ref={mapRef} className={styles.map} />
                </>
            )}
        </div>
    )
}
