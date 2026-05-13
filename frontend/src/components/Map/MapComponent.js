import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Calculate distance between two coordinates in kilometers
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ 
  height = '400px', 
  issues = [], 
  selectedIssue = null,
  adminLocation = null,
  showRouting = false,
  onIssueSelect = () => {},
  clickable = false,
  className = '',
  // New props for manual location selection
  center = null,
  currentLocation = null,
  onLocationChange = null,
  onMapClick = null,
  draggableMarker = false
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routingLayerRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ Initializing map...');

    // Create map instance
    const defaultCenter = center || [40.7128, -74.0060]; // Use custom center or default to NYC
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create layers
    const markersLayer = L.layerGroup().addTo(map);
    const routingLayer = L.layerGroup().addTo(map);

    // Store references
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    routingLayerRef.current = routingLayer;

    // Add map click handler for manual location selection
    if (clickable && (onMapClick || onLocationChange)) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        console.log('🎯 Map clicked at:', { lat, lng });
        
        // Call the callback functions
        if (onMapClick) onMapClick({ lat, lng });
        if (onLocationChange) onLocationChange({ lat, lng });
      });
      console.log('✅ Map click handler added for location selection');
    }

    console.log('✅ Map initialized successfully');
    setMapReady(true);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add issue markers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current) return;

    console.log('📍 Adding issue markers:', issues.length);

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    if (issues.length === 0) return;

    issues.forEach((issue) => {
      if (!issue.location?.coordinates) return;

      const [lng, lat] = issue.location.coordinates;
      
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'issue-marker',
          html: `
            <div style="
              background: #EF4444;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `,
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      });

      marker.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #1F2937; font-weight: 600;">${issue.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">${issue.description}</p>
          <div style="margin: 8px 0;">
            <span style="background: #EF4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              ${issue.category}
            </span>
          </div>
        </div>
      `);

      // Add click handler for routing
      marker.on('click', () => {
        console.log('🎯 Issue marker clicked:', issue.title);
        onIssueSelect(issue);
        
        // Show route if admin location is available
        if (showRouting && adminLocation) {
          showRouteToIssue(lat, lng);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Fit map to show all markers
    if (issues.length > 0) {
      const group = new L.featureGroup(markersLayerRef.current.getLayers());
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    console.log('✅ Issue markers added successfully');
  }, [issues, mapReady, onIssueSelect, showRouting, adminLocation]);

  // Function to show route to issue
  const showRouteToIssue = (issueLat, issueLng) => {
    console.log('🔍 ROUTE REQUEST RECEIVED');
    console.log('📍 Admin Location Available:', !!adminLocation);
    console.log('📍 Admin Location Data:', adminLocation);
    console.log('🗺️ Routing Layer Available:', !!routingLayerRef.current);
    
    if (!adminLocation || !routingLayerRef.current) {
      console.log('❌ Cannot show route: missing admin location or routing layer');
      if (!adminLocation) {
        console.log('⚠️ ADMIN LOCATION IS NULL - Please enable location first!');
      }
      return;
    }

    console.log('🗺️ SHOWING BLUE ROUTE LINE');
    console.log('📍 From Admin (CURRENT LOCATION):', adminLocation);
    console.log('📍 To Issue:', { lat: issueLat, lng: issueLng });

    // Clear existing routes
    routingLayerRef.current.clearLayers();

    // Create blue route line coordinates
    const routeCoordinates = [
      [adminLocation.lat, adminLocation.lng], // Start point
      [issueLat, issueLng] // End point
    ];

    console.log('🎨 Creating blue line with coordinates:', routeCoordinates);

    // Create the blue route line
    const routeLine = L.polyline(routeCoordinates, {
      color: '#3B82F6',
      weight: 8,
      opacity: 1.0,
      className: 'route-line'
    });

    // Add route line to map
    routingLayerRef.current.addLayer(routeLine);
    console.log('✅ BLUE ROUTE LINE ADDED TO MAP');

    // Add start marker (Admin location)
    const startMarker = L.marker([adminLocation.lat, adminLocation.lng], {
      icon: L.divIcon({
        className: 'start-marker',
        html: `
          <div style="
            background: #10B981;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">🚩</div>
        `,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      })
    }).bindPopup(`
      <div style="text-align: center; font-weight: 600;">
        <div style="color: #10B981; margin-bottom: 4px;">🚩 Your Current Location</div>
        <div style="font-size: 12px; color: #6B7280;">Admin Position (GPS)</div>
        <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">
          Lat: ${adminLocation.lat.toFixed(6)}<br>
          Lng: ${adminLocation.lng.toFixed(6)}
        </div>
      </div>
    `);

    routingLayerRef.current.addLayer(startMarker);
    console.log('✅ START MARKER ADDED');

    // Add end marker (Issue location)
    const endMarker = L.marker([issueLat, issueLng], {
      icon: L.divIcon({
        className: 'end-marker',
        html: `
          <div style="
            background: #EF4444;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">🎯</div>
        `,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      })
    }).bindPopup('🎯 Issue Location (Destination)');

    routingLayerRef.current.addLayer(endMarker);
    console.log('✅ END MARKER ADDED');

    // Calculate and show distance
    const distance = calculateDistance(adminLocation, { lat: issueLat, lng: issueLng });
    console.log('📏 Distance calculated:', distance.toFixed(2), 'km');

    // Add distance info marker
    const midLat = (adminLocation.lat + issueLat) / 2;
    const midLng = (adminLocation.lng + issueLng) / 2;
    
    const infoMarker = L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: 'route-info-marker',
        html: `
          <div style="
            background: rgba(59, 130, 246, 0.95);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid white;
          ">
            📏 ${distance.toFixed(2)} km
          </div>
        `,
        iconSize: [100, 25],
        iconAnchor: [50, 12]
      })
    });

    routingLayerRef.current.addLayer(infoMarker);
    console.log('✅ DISTANCE INFO ADDED');

    // Zoom to show complete route
    const group = new L.featureGroup([startMarker, endMarker]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
    console.log('✅ MAP ZOOMED TO SHOW COMPLETE ROUTE');
  };

  // Show route when selectedIssue changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedIssue && showRouting && adminLocation && mapReady) {
      const [lng, lat] = selectedIssue.location.coordinates;
      showRouteToIssue(lat, lng);
    }
  }, [selectedIssue, showRouting, adminLocation, mapReady]);

  // Handle manual location selection marker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current) return;

    // Remove existing location marker
    if (locationMarkerRef.current) {
      markersLayerRef.current.removeLayer(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }

    // Add new location marker if currentLocation is set
    if (currentLocation) {
      console.log('📍 Adding manual location marker at:', currentLocation);
      
      const locationMarker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: L.divIcon({
          className: 'location-selection-marker',
          html: `
            <div style="
              background: #3B82F6;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              cursor: ${draggableMarker ? 'move' : 'pointer'};
            ">📍</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        }),
        draggable: draggableMarker
      });

      locationMarker.bindPopup(`
        <div style="text-align: center; font-weight: 600;">
          <div style="color: #3B82F6; margin-bottom: 4px;">📍 Selected Location</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">
            Lat: ${currentLocation.lat.toFixed(6)}<br>
            Lng: ${currentLocation.lng.toFixed(6)}
          </div>
          ${draggableMarker ? '<div style="font-size: 10px; color: #6B7280; margin-top: 4px;">Drag to adjust position</div>' : ''}
        </div>
      `);

      // Handle marker drag if draggable
      if (draggableMarker && onLocationChange) {
        locationMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          console.log('🎯 Location marker dragged to:', { lat, lng });
          onLocationChange({ lat, lng });
        });
      }

      markersLayerRef.current.addLayer(locationMarker);
      locationMarkerRef.current = locationMarker;
      
      console.log('✅ Manual location marker added');

      // Center map on the selected location
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [currentLocation, mapReady, draggableMarker, onLocationChange]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
      
      {/* Map overlay info */}
      {issues.length > 0 && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Routing info */}
      {showRouting && adminLocation && (
        <div className="absolute top-4 right-4 bg-green-600 text-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="w-4 h-4" />
            <span>📍 Current Location Enabled</span>
          </div>
          <div className="text-xs opacity-90 mt-1">
            Click issue to show route from your location
          </div>
        </div>
      )}

      {/* No location warning */}
      {showRouting && !adminLocation && (
        <div className="absolute top-4 right-4 bg-orange-600 text-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="w-4 h-4" />
            <span>⚠️ Location Required</span>
          </div>
          <div className="text-xs opacity-90 mt-1">
            Enable location to show routes
          </div>
        </div>
      )}

      {/* Manual location selection instruction */}
      {clickable && !currentLocation && !showRouting && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            <span>🎯 Click to Select Location</span>
          </div>
          <div className="text-xs opacity-90 mt-1">
            Click anywhere on the map to choose location
          </div>
        </div>
      )}

      {/* Selected location confirmation */}
      {clickable && currentLocation && !showRouting && (
        <div className="absolute top-4 left-4 bg-green-600 text-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            <span>✅ Location Selected</span>
          </div>
          <div className="text-xs opacity-90 mt-1">
            {draggableMarker ? 'Drag marker to adjust position' : 'Click elsewhere to change location'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;