import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapContainer = ({ 
  center = [22.8, 88.4], // Default near Bengal / Singur area
  zoom = 9, 
  onMapClick, 
  selectedCrop, 
  selectedStorage,
  evacuationRoute,
  showCrops = true,
  showStorages = true,
  showAlerts = true
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({
    crops: [],
    storages: [],
    alerts: [],
    route: null
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(center, zoom);

    // CartoDB Dark Matter tile layer - matches premium dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Handle clicks for setting coordinate markers
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (onMapClick) {
        onMapClick(lat, lng);
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center when explicitly changed
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center]);

  // Redraw Markers whenever crops, storages, alerts, or selection/routing changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;

    // 1. Clear existing markers
    markers.crops.forEach(m => map.removeLayer(m));
    markers.crops = [];

    markers.storages.forEach(m => map.removeLayer(m));
    markers.storages = [];

    markers.alerts.forEach(m => map.removeLayer(m));
    markers.alerts = [];

    if (markers.route) {
      map.removeLayer(markers.route);
      markers.route = null;
    }

    // Custom Icon Helpers
    const createHtmlIcon = (emoji, colorClass, size = 32) => {
      return L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 shadow-lg text-lg ${colorClass}">${emoji}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    };

    // 2. Plot Cold Storages
    if (showStorages && selectedStorage) {
      // If we have storage list, iterate
      const storageList = Array.isArray(selectedStorage) ? selectedStorage : [selectedStorage];
      storageList.forEach(s => {
        if (!s.location || !s.location.latitude) return;
        const freeCapacity = Math.max(0, s.totalCapacity - s.occupiedCapacity);
        const freePct = Math.round((freeCapacity / s.totalCapacity) * 100);

        const marker = L.marker([s.location.latitude, s.location.longitude], {
          icon: createHtmlIcon('❄️', 'bg-blue-600/90 text-white border-blue-400')
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <h4 class="font-bold text-sm text-blue-400">${s.facilityName}</h4>
            <p class="text-slate-300 mt-1">📍 ${s.location.address}</p>
            <div class="mt-2 bg-slate-950/60 p-1.5 rounded border border-white/10">
              <p class="flex justify-between"><span>Free Space:</span> <span class="font-bold text-emerald-400">${freeCapacity} kg (${freePct}%)</span></p>
              <p class="flex justify-between"><span>Total capacity:</span> <span>${s.totalCapacity} kg</span></p>
              <p class="flex justify-between"><span>Rate per Ton:</span> <span class="text-amber-400">₹${s.pricePerTonPerDay}/day</span></p>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5">📞 Contact: ${s.phone}</p>
          </div>
        `);

        markers.storages.push(marker);
      });
    }

    // 3. Plot Crops
    if (showCrops && selectedCrop) {
      const cropList = Array.isArray(selectedCrop) ? selectedCrop : [selectedCrop];
      cropList.forEach(c => {
        if (!c.location || !c.location.latitude) return;

        let emoji = '🌾';
        let colorClass = 'bg-emerald-600/90 text-white border-emerald-400';
        if (c.status === 'Relocated') {
          emoji = '🚚';
          colorClass = 'bg-amber-600/90 text-white border-amber-400';
        } else if (c.status === 'Sold') {
          emoji = '💰';
          colorClass = 'bg-purple-600/90 text-white border-purple-400';
        }

        const marker = L.marker([c.location.latitude, c.location.longitude], {
          icon: createHtmlIcon(emoji, colorClass)
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <div class="flex items-center justify-between gap-2">
              <h4 class="font-bold text-sm text-emerald-400">${c.type}</h4>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${c.status}</span>
            </div>
            <p class="text-slate-300 mt-1">👨🌾 Grower: ${c.farmerName}</p>
            <div class="mt-2 bg-slate-950/60 p-1.5 rounded border border-white/10">
              <p class="flex justify-between"><span>Quantity:</span> <span class="font-bold text-white">${c.quantity} kg</span></p>
              <p class="flex justify-between"><span>Price/Kg:</span> <span class="text-amber-400 font-semibold">₹${c.pricePerKg}</span></p>
              <p class="flex justify-between"><span>Total:</span> <span class="text-emerald-400 font-bold">₹${c.quantity * c.pricePerKg}</span></p>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5">📍 Location: ${c.location.address}</p>
          </div>
        `);

        markers.crops.push(marker);
      });
    }

    // 4. Plot Active Disaster Weather Alerts
    if (showAlerts && showAlerts.length > 0) {
      showAlerts.forEach(alert => {
        if (!alert.location || !alert.location.latitude) return;

        // Overlay hazard red circle
        const circle = L.circle([alert.location.latitude, alert.location.longitude], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          radius: (alert.location.radiusKm || 15) * 1000, // Convert to meters
          weight: 1.5,
          className: 'animate-pulse-slow'
        }).addTo(map);

        circle.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <h4 class="font-bold text-sm text-red-500 flex items-center gap-1">🚨 ${alert.title}</h4>
            <p class="text-slate-200 mt-1">${alert.description}</p>
            <p class="text-[10px] text-red-400 font-semibold mt-1">Severity: ${alert.severity} | Radius: ${alert.location.radiusKm} km</p>
          </div>
        `);

        markers.alerts.push(circle);
      });
    }

    // 5. Draw Evacuation / Relocation Route Polyline
    if (evacuationRoute && evacuationRoute.length > 1) {
      const line = L.polyline(evacuationRoute, {
        color: '#f59e0b', // Amber line for evacuation route
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8', // Animated dash effect
        className: 'evacuation-route-line'
      }).addTo(map);

      // Fit map bounds to the evacuation route
      map.fitBounds(line.getBounds(), { padding: [50, 50] });

      markers.route = line;
    }

  }, [showCrops, showStorages, showAlerts, selectedCrop, selectedStorage, evacuationRoute]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10" />
      
      {/* Dynamic Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-white/10 text-[10px] space-y-1.5 pointer-events-none select-none">
        <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1">AgriLink Map Legend</h5>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600/25 border border-emerald-500 text-xs">🌾</span>
          <span className="text-slate-300 font-medium">Farmer's Crop Listing (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/25 border border-blue-500 text-xs">❄️</span>
          <span className="text-slate-300 font-medium">B2B Cold Storage Node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600/25 border border-amber-500 text-xs">🚚</span>
          <span className="text-slate-300 font-medium">Relocated/Evacuated Yield</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border border-red-500 bg-red-500/20 inline-block"></span>
          <span className="text-slate-300 font-medium">Active Weather Hazard Ring</span>
        </div>
        {evacuationRoute && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="w-6 h-0.5 border-t border-dashed border-amber-500 inline-block"></span>
            <span className="text-amber-400 font-semibold">Active Disaster Evacuation Route</span>
          </div>
        )}
      </div>
      
      <style>{`
        .evacuation-route-line {
          animation: routePulse 1.5s linear infinite;
        }
        @keyframes routePulse {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
};

export default MapContainer;
