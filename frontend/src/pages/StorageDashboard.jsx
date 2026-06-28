import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MapContainer from '../components/MapContainer';
import { 
  Warehouse, 
  Activity, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  Map, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert,
  Percent
} from 'lucide-react';

const StorageDashboard = ({ activeSubTab }) => {
  const { 
    user, 
    requests, 
    crops, 
    alerts, 
    token, 
    syncData, 
    addNotification,
    setStorages
  } = useApp();

  const [localSubTab, setLocalSubTab] = useState('capacity'); // capacity, incoming, map, emergency
  const [updating, setUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Capacity Form State
  const [totalCapacity, setTotalCapacity] = useState(user?.totalCapacity?.toString() || '5000');
  const [occupiedCapacity, setOccupiedCapacity] = useState(user?.occupiedCapacity?.toString() || '0');
  const [pricePerTon, setPricePerTon] = useState(user?.pricePerTonPerDay?.toString() || '12');
  const [discountPct, setDiscountPct] = useState(user?.discountPct?.toString() || '0');

  useEffect(() => {
    if (activeSubTab) {
      setLocalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Handle local state updates if user context fetches late
  useEffect(() => {
    if (user) {
      setTotalCapacity(user.totalCapacity?.toString() || '5000');
      setOccupiedCapacity(user.occupiedCapacity?.toString() || '0');
      setPricePerTon(user.pricePerTonPerDay?.toString() || '12');
      setDiscountPct(user.discountPct?.toString() || '0');
    }
  }, [user]);

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/storage/capacity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalCapacity: parseFloat(totalCapacity),
          occupiedCapacity: parseFloat(occupiedCapacity),
          pricePerTonPerDay: parseFloat(pricePerTon),
          discountPct: parseFloat(discountPct)
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Sync local user object in localstorage if needed
        localStorage.setItem('user', JSON.stringify(updatedUser));
        syncData();
        addNotification({
          id: Date.now(),
          type: 'success',
          title: '❄️ Capacity Profile Updated',
          message: `Storage parameters successfully broadcast to local Farmers grid.`,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await fetch(`/api/storage/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }) // Approved or Rejected
      });

      if (res.ok) {
        syncData();
        addNotification({
          id: Date.now(),
          type: status === 'Approved' ? 'success' : 'danger',
          title: `Request ${status}`,
          message: `You have ${status.toLowerCase()} the storage request.`,
          time: new Date().toLocaleTimeString()
        });
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to update request.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Filter requests sent to this storage facility
  const myRequests = requests.filter(r => r.storageId === user?.id);
  const incomingRequests = myRequests.filter(r => r.status === 'Pending' && !r.isEmergency);
  const activeBookings = myRequests.filter(r => r.status === 'Approved');
  const emergencyEvacs = myRequests.filter(r => r.isEmergency);

  // Compute metrics
  const freeCapacity = Math.max(0, parseFloat(totalCapacity) - parseFloat(occupiedCapacity));
  const occupiedPct = Math.round((parseFloat(occupiedCapacity) / parseFloat(totalCapacity)) * 100) || 0;

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-57px)] lg:max-h-[calc(100vh-65px)]">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4 text-left">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-blue-400" /> {user?.facilityName || 'Storage Dashboard'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">📍 {user?.location?.address || 'Shimla, India'}</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-2.5 rounded-xl border border-white/10 text-xs">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Free Capacity</span>
            <span className="font-bold text-emerald-400 text-sm">{freeCapacity} kg</span>
          </div>
          <div className="border-l border-white/15 h-8"></div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Utilization</span>
            <span className="font-bold text-blue-400 text-sm">{occupiedPct}%</span>
          </div>
        </div>
      </div>

      {/* Capacity & Price Controller Tab */}
      {localSubTab === 'capacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Metrics Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="glass-panel border-white/5 rounded-2xl p-4.5 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Occupied Space</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">{occupiedCapacity} <span className="text-xs font-normal text-slate-500">kg</span></h3>
                <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${occupiedPct}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500">{occupiedPct}% utilized</p>
              </div>

              <div className="glass-panel border-white/5 rounded-2xl p-4.5 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Daily Rate</span>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-amber-400">₹{pricePerTon} <span className="text-xs font-normal text-slate-500">/ton/day</span></h3>
                <p className="text-[10px] text-slate-500">Listed rate on Maps directory</p>
              </div>

              <div className="glass-panel border-white/5 rounded-2xl p-4.5 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Dynamic Off-peak Discount</span>
                  <Percent className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-400">{discountPct}% <span className="text-xs font-normal text-slate-500">OFF</span></h3>
                <p className="text-[10px] text-slate-500">Optimizes off-season space utility</p>
              </div>
            </div>

            {/* Active Bookings List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300">Active Booked Crops</h3>
              {activeBookings.length === 0 ? (
                <div className="glass-panel border-white/5 rounded-2xl py-8 px-4 text-center text-slate-500 text-xs font-light">
                  No crops are stored in your facility at this moment.
                </div>
              ) : (
                <div className="glass-panel border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="p-3">Grower Farmer</th>
                        <th className="p-3">Crop variety</th>
                        <th className="p-3">Quantity (kg)</th>
                        <th className="p-3">Contract Duration</th>
                        <th className="p-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {activeBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/10">
                          <td className="p-3 font-semibold text-slate-100">{b.farmerName}</td>
                          <td className="p-3 text-blue-400">{b.cropType}</td>
                          <td className="p-3">{b.quantity} kg</td>
                          <td className="p-3">{b.durationDays} Days</td>
                          <td className="p-3 text-right font-bold text-emerald-400">₹{b.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Form Settings */}
          <div className="lg:col-span-4">
            <div className="glass-panel border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-200 border-b border-white/15 pb-2.5">
                Facility Configuration
              </h3>
              
              <form onSubmit={handleUpdateCapacity} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Capacity (kg)</label>
                  <input 
                    type="number" 
                    required 
                    value={totalCapacity} 
                    onChange={e => setTotalCapacity(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Occupied Capacity (kg)</label>
                  <input 
                    type="number" 
                    required 
                    value={occupiedCapacity} 
                    onChange={e => setOccupiedCapacity(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">Adjusts available space shown to farmers.</span>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rate per Ton per Day (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={pricePerTon} 
                    onChange={e => setPricePerTon(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex justify-between mb-1">
                    <span>Off-Peak Discount (%)</span>
                    <span className="text-emerald-400 font-bold">{discountPct}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    value={discountPct} 
                    onChange={e => setDiscountPct(e.target.value)} 
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={updating}
                  className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Configurations'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Requests Tab */}
      {localSubTab === 'incoming' && (
        <div className="space-y-4 text-left">
          <h2 className="text-lg font-bold tracking-tight text-slate-200">Incoming Farmer Reservations</h2>
          
          {incomingRequests.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-500 text-xs font-light">
              No pending reservations requested at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests.map((req) => (
                <div key={req.id} className="glass-panel rounded-xl p-4.5 flex flex-col justify-between h-44 border-white/10 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-200">{req.cropType}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1">
                      <p>Farmer: <span className="font-semibold text-slate-200">{req.farmerName}</span></p>
                      <p>Volume: <span className="font-semibold text-slate-200">{req.quantity} kg</span></p>
                      <p>Duration: <span className="font-semibold text-slate-200">{req.durationDays} Days</span></p>
                      <p>Revenue: <span className="font-bold text-emerald-400">₹{req.price}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 border-t border-white/5 pt-3.5">
                    <button
                      disabled={actionLoading[req.id]}
                      onClick={() => handleRequestAction(req.id, 'Approved')}
                      className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-950/20"
                    >
                      {actionLoading[req.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept Booking</>}
                    </button>
                    <button
                      disabled={actionLoading[req.id]}
                      onClick={() => handleRequestAction(req.id, 'Rejected')}
                      className="px-3 py-1.5 rounded border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-bold text-xs uppercase transition flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Geospatial Map Tab */}
      {localSubTab === 'map' && (
        <div className="h-[calc(100vh-160px)]">
          <MapContainer 
            center={user?.location ? [user.location.latitude, user.location.longitude] : [22.8, 88.4]}
            selectedCrop={crops}
            selectedStorage={user ? [user] : []}
            showAlerts={alerts}
          />
        </div>
      )}

      {/* Disaster Emergency Relocations Tab */}
      {localSubTab === 'emergency' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-200">Disaster Relocation Logs</h2>
          </div>

          <p className="text-xs text-slate-400 max-w-2xl font-light leading-relaxed">
            During weather crises, the system activates pre-routed auto-approvals for crops in danger. Evacuated crops listed below are granted direct priority storage access without manual intervention.
          </p>
          
          {emergencyEvacs.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-500 text-xs font-light">
              No emergency relocations recorded during this session.
            </div>
          ) : (
            <div className="glass-panel border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-4">Evacuation ID</th>
                    <th className="p-4">Farmer Name</th>
                    <th className="p-4">Crop variety</th>
                    <th className="p-4">Evacuated Weight</th>
                    <th className="p-4">Date Evacuated</th>
                    <th className="p-4">Relocation State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {emergencyEvacs.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/10">
                      <td className="p-4 font-mono text-[10px] text-slate-400">{e.id}</td>
                      <td className="p-4 font-semibold text-slate-100">{e.farmerName}</td>
                      <td className="p-4 text-blue-400">{e.cropType}</td>
                      <td className="p-4">{e.quantity} kg</td>
                      <td className="p-4 text-slate-400">{new Date(e.dateRequested).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          Auto-Approved Evac
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default StorageDashboard;
