import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MapContainer from '../components/MapContainer';
import { 
  ShieldAlert, 
  MapPin, 
  Loader2, 
  AlertOctagon, 
  Play, 
  XCircle, 
  HelpCircle,
  Activity,
  Compass
} from 'lucide-react';

const EmergencyConsole = () => {
  const { 
    alerts, 
    crops, 
    storages, 
    token, 
    syncData, 
    addNotification,
    setAlerts
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Alert Form State
  const [alertType, setAlertType] = useState('Flood Warning');
  const [title, setTitle] = useState('Heavy Precipitation & Flash Flood Warning');
  const [description, setDescription] = useState('Severe precipitation and rising river basins expected in this agricultural pocket. Relocate harvested crops to the nearest available cold storage immediately.');
  const [radiusKm, setRadiusKm] = useState('20');
  const [severity, setSeverity] = useState('Critical');
  
  // Coordinates default to Rajesh Farmer's Singur coordinates so it matches the demo out-of-the-box
  const [lat, setLat] = useState('22.8251');
  const [lng, setLng] = useState('88.3902');
  const [address, setAddress] = useState('Singur, Hooghly District, West Bengal');

  const handleMapClick = (clickLat, clickLng) => {
    setLat(clickLat.toFixed(5));
    setLng(clickLng.toFixed(5));
    setAddress(`Simulation Center [${clickLat.toFixed(4)}, ${clickLng.toFixed(4)}]`);
  };

  const handleTriggerAlert = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: alertType,
          title,
          description,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radiusKm: parseFloat(radiusKm),
          severity
        })
      });

      if (res.ok) {
        syncData();
        addNotification({
          id: Date.now(),
          type: 'danger',
          title: `🚨 SIMULATION: ${title}`,
          message: `Disaster alert triggered over a ${radiusKm}km radius.`,
          time: new Date().toLocaleTimeString()
        });
      } else {
        // Fallback for offline mode
        const mockAlert = {
          id: `alert_${Date.now()}`,
          type: alertType,
          title,
          description,
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radiusKm: parseFloat(radiusKm)
          },
          severity,
          dateCreated: new Date().toISOString(),
          active: true
        };
        setAlerts(prev => [mockAlert, ...prev]);
        addNotification({
          id: Date.now(),
          type: 'danger',
          title: `🚨 MOCK SIMULATION: ${title}`,
          message: `Offline mode: Disaster alert simulated. Check Farmer Evacuation tab!`,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Find crops affected by simulated warnings (inside warning radius)
  const getAffectedCropsCount = () => {
    let count = 0;
    alerts.forEach(alert => {
      if (!alert.location) return;
      crops.forEach(crop => {
        if (!crop.location) return;
        const getDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };
        const distance = getDistance(crop.location.latitude, crop.location.longitude, alert.location.latitude, alert.location.longitude);
        if (distance <= alert.location.radiusKm && (crop.status === 'Available' || crop.status === 'Stored')) {
          count++;
        }
      });
    });
    return count;
  };

  const handleClearAlerts = () => {
    // Reset alerts in app context
    setAlerts([]);
    addNotification({
      id: Date.now(),
      type: 'success',
      title: '✅ Weather System Normal',
      message: 'All simulated disaster vectors have been deactivated.',
      time: new Date().toLocaleTimeString()
    });
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-57px)] lg:max-h-[calc(100vh-65px)]">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 text-left">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" /> Climate Hazard & Emergency Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1">Control Console for testing automatic relocation routing and push warnings.</p>
        </div>
        
        {alerts.length > 0 && (
          <button 
            onClick={handleClearAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition uppercase"
          >
            <XCircle className="w-4 h-4" /> Deactivate Hazards
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Simulation Forms Panel */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-white/15 pb-2.5 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" /> Trigger Simulation Vector
            </h3>

            <form onSubmit={handleTriggerAlert} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Disaster Vector</label>
                  <select 
                    value={alertType} 
                    onChange={e => setAlertType(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer border-none"
                  >
                    <option value="Flood Warning">🌧️ Flash Flood</option>
                    <option value="Storm Warning">🌀 Cyclonic Storm</option>
                    <option value="Extreme Heatwave">☀️ Extreme Drought</option>
                    <option value="Frost Warning">❄️ Ground Frost</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity Rating</label>
                  <select 
                    value={severity} 
                    onChange={e => setSeverity(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer border-none"
                  >
                    <option value="Moderate">Moderate Risk</option>
                    <option value="High">High Hazard</option>
                    <option value="Critical">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alert Headline Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Evacuation Description</label>
                <textarea 
                  required 
                  rows="3"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Evacuation Center Coordinates</label>
                  <div className="flex gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{lat}</span>
                    <span>,</span>
                    <span>{lng}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Radius (km)</label>
                  <input 
                    type="number" 
                    required 
                    value={radiusKm} 
                    onChange={e => setRadiusKm(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/30 text-[10px] text-slate-400 flex gap-2">
                <Compass className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="leading-relaxed">Click any coordinate on the map canvas to the right to dynamically center the disaster warning overlay.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Broadcast simulated emergency</>}
              </button>
            </form>
          </div>

          {/* Warning Impact Panel */}
          {alerts.length > 0 && (
            <div className="glass-panel border-white/5 rounded-2xl p-4.5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Simulation Impact Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-[9px] uppercase">Active Alerts</span>
                  <span className="text-xl font-bold text-red-400">{alerts.length} Warnings</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block text-[9px] uppercase">Affected Crops</span>
                  <span className="text-xl font-bold text-amber-500">{getAffectedCropsCount()} Listings</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Live Simulation Map Canvas */}
        <div className="lg:col-span-7 h-[calc(100vh-160px)]">
          <MapContainer 
            center={[parseFloat(lat), parseFloat(lng)]} 
            onMapClick={handleMapClick}
            selectedCrop={crops}
            selectedStorage={storages}
            showAlerts={alerts}
          />
        </div>

      </div>

    </div>
  );
};

export default EmergencyConsole;
