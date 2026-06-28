import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MapContainer from '../components/MapContainer';
import { 
  Sprout, 
  Warehouse, 
  TrendingUp, 
  MapPin, 
  Plus, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronRight, 
  Loader2, 
  Activity,
  Calendar,
  Compass,
  ArrowRight
} from 'lucide-react';

const FarmerDashboard = ({ activeSubTab }) => {
  const { 
    user, 
    crops, 
    storages, 
    requests, 
    orders, 
    alerts, 
    token, 
    syncData, 
    addNotification,
    activeEvacuationRoute,
    setActiveEvacuationRoute
  } = useApp();

  const [localSubTab, setLocalSubTab] = useState('listings'); // listings, requests, orders, map, emergency
  const [formLoading, setFormLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState({});
  const [relocateLoading, setRelocateLoading] = useState(false);

  // Form State
  const [cropType, setCropType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [customLat, setCustomLat] = useState(user?.location?.latitude?.toString() || '22.8251');
  const [customLng, setCustomLng] = useState(user?.location?.longitude?.toString() || '88.3902');
  const [customAddress, setCustomAddress] = useState(user?.location?.address || '');

  // Evacuation Planning State
  const [selectedCropForEvac, setSelectedCropForEvac] = useState(null);
  const [evacOptions, setEvacOptions] = useState([]);
  const [evacOptionsLoading, setEvacOptionsLoading] = useState(false);

  // Sync sub tab with parent sidebar trigger
  useEffect(() => {
    if (activeSubTab) {
      setLocalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleMapClick = (lat, lng) => {
    setCustomLat(lat.toFixed(5));
    setCustomLng(lng.toFixed(5));
    setCustomAddress(`Map Pin Grid [${lat.toFixed(3)}, ${lng.toFixed(3)}]`);
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!cropType || !quantity || !pricePerKg) return;

    setFormLoading(true);
    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: cropType,
          quantity: parseFloat(quantity),
          pricePerKg: parseFloat(pricePerKg),
          durationDays: parseInt(durationDays),
          location: {
            latitude: parseFloat(customLat),
            longitude: parseFloat(customLng),
            address: customAddress
          }
        })
      });

      if (res.ok) {
        setCropType('');
        setQuantity('');
        setPricePerKg('');
        syncData();
        addNotification({
          id: Date.now(),
          type: 'success',
          title: '🌾 Crop Uploaded',
          message: `Successfully listed ${quantity}kg of ${cropType} on Marketplace.`,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendStorageRequest = async (storageId, cropId, storageName) => {
    setRequestLoading(prev => ({ ...prev, [storageId]: true }));
    try {
      const res = await fetch('/api/storage/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropId,
          storageId,
          durationDays: 30
        })
      });

      if (res.ok) {
        syncData();
        addNotification({
          id: Date.now(),
          type: 'info',
          title: '❄️ Request Dispatched',
          message: `Storage reservation request sent to ${storageName}.`,
          time: new Date().toLocaleTimeString()
        });
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestLoading(prev => ({ ...prev, [storageId]: false }));
    }
  };

  const handleQueryEvacOptions = async (crop) => {
    setSelectedCropForEvac(crop);
    setEvacOptionsLoading(true);
    setActiveEvacuationRoute(null);
    try {
      const res = await fetch(`/api/emergency/relocate-options?cropId=${crop.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvacOptions(data);
        if (data.length > 0) {
          // Pre-select closest option's route on the map
          setActiveEvacuationRoute(data[0].route);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvacOptionsLoading(false);
    }
  };

  const handleExecuteEvac = async (option) => {
    if (!selectedCropForEvac) return;
    setRelocateLoading(true);
    try {
      const res = await fetch('/api/emergency/relocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropId: selectedCropForEvac.id,
          storageId: option.id,
          price: option.pricePerTonPerDay * (selectedCropForEvac.quantity / 1000) * 14 // 14 days emergency
        })
      });

      if (res.ok) {
        setSelectedCropForEvac(null);
        setEvacOptions([]);
        setActiveEvacuationRoute(null);
        syncData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRelocateLoading(false);
    }
  };

  // Filter listings owned by this farmer
  const myCrops = crops.filter(c => c.farmerId === user.id);
  const myRequests = requests.filter(r => r.farmerId === user.id);
  const myOrders = orders.filter(o => o.farmerId === user.id);

  // Check if farmer is in an active weather alert zone
  const activeAlertsInMyZone = alerts.filter(alert => {
    if (!alert.location || !user.location) return false;
    // Simple rough distance check: inside alert radius
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
    const distance = getDistance(user.location.latitude, user.location.longitude, alert.location.latitude, alert.location.longitude);
    return distance <= (alert.location.radiusKm || 15);
  });

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-57px)] lg:max-h-[calc(100vh-65px)]">
      
      {/* Alert Banner */}
      {activeAlertsInMyZone.length > 0 && (
        <div className="glass-card-red border-red-500/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-red-400">🚨 DISASTER WARNING ACTIVE IN YOUR ZONE</h4>
              <p className="text-xs text-slate-300 mt-0.5">{activeAlertsInMyZone[0].title}: {activeAlertsInMyZone[0].description}</p>
            </div>
          </div>
          <button 
            onClick={() => setLocalSubTab('emergency')}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider transition uppercase"
          >
            Manage Evacuation
          </button>
        </div>
      )}

      {/* Main Content Area based on SubTab */}
      {localSubTab === 'listings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Crop List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Active Crop Listings</h2>
              <span className="text-xs text-slate-500 font-medium">{myCrops.length} Listings</span>
            </div>

            {myCrops.length === 0 ? (
              <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-400 space-y-3">
                <Sprout className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-light">You have no listed crops. Fill out the form to upload your yield.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCrops.map((crop) => (
                  <div key={crop.id} className="glass-panel glass-panel-hover rounded-xl p-4.5 text-left flex flex-col justify-between h-44">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-slate-200">{crop.type}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          crop.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          crop.status === 'Stored' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          crop.status === 'Relocated' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {crop.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                        <p>Quantity: <span className="font-semibold text-slate-200">{crop.quantity} kg</span></p>
                        <p>Price: <span className="font-semibold text-slate-200">₹{crop.pricePerKg}/kg</span></p>
                        <p className="col-span-2 truncate">📍 Address: {crop.location.address}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Listed: {new Date(crop.dateListed).toLocaleDateString()}</span>
                      
                      {crop.status === 'Available' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              // Filter storages with capacity, pre-select
                              const availableStorage = storages.find(s => s.totalCapacity - s.occupiedCapacity >= crop.quantity);
                              if (availableStorage) {
                                handleSendStorageRequest(availableStorage.id, crop.id, availableStorage.facilityName);
                              } else {
                                alert("No storage facility has sufficient capacity at this time.");
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase transition"
                          >
                            <Warehouse className="w-3 h-3" /> Storage Request
                          </button>
                        </div>
                      )}

                      {crop.status === 'Relocated' && (
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">🚚 Evacuated Node</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Crop Form */}
          <div className="lg:col-span-4">
            <div className="glass-panel border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-white/15 pb-2.5">
                <Plus className="w-5 h-5 text-emerald-400" /> Upload New Crop
              </h3>
              
              <form onSubmit={handleAddCrop} className="space-y-3.5 text-left">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Crop Variety / Type</label>
                  <input 
                    type="text" 
                    required 
                    value={cropType} 
                    onChange={e => setCropType(e.target.value)} 
                    placeholder="e.g. Potato (Jyoti), Red Onion" 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity (kg)</label>
                    <input 
                      type="number" 
                      required 
                      value={quantity} 
                      onChange={e => setQuantity(e.target.value)} 
                      placeholder="e.g. 1500" 
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Price per Kg (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={pricePerKg} 
                      onChange={e => setPricePerKg(e.target.value)} 
                      placeholder="e.g. 18" 
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Storage Duration (Days)</label>
                  <input 
                    type="number" 
                    required 
                    value={durationDays} 
                    onChange={e => setDurationDays(e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl border border-white/5 bg-slate-900/30 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Geographic Origin</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <p>Lat: <span className="text-slate-300 font-semibold">{customLat}</span></p>
                    <p>Lng: <span className="text-slate-300 font-semibold">{customLng}</span></p>
                  </div>
                  <p className="text-[10px] text-slate-400 italic leading-tight">Double-click / Click on the Geospatial Map tab to position custom marker pins.</p>
                </div>

                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="w-full py-2 mt-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'List Crop to Retailers'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Storage Requests Tab */}
      {localSubTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-200 text-left">Cold Storage Reservation Requests</h2>
          
          {myRequests.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-400 space-y-3">
              <Warehouse className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-light">No storage requests created yet. Browse cold storage facilities on the map to submit.</p>
            </div>
          ) : (
            <div className="glass-panel border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="p-4">Request ID</th>
                      <th className="p-4">Crop Type</th>
                      <th className="p-4">Quantity (kg)</th>
                      <th className="p-4">Cold Storage Node</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Estimated Charge</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {myRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/25 transition">
                        <td className="p-4 font-mono text-[10px] text-slate-400">{req.id}</td>
                        <td className="p-4 font-semibold text-slate-100">{req.cropType}</td>
                        <td className="p-4">{req.quantity} kg</td>
                        <td className="p-4 font-medium text-blue-400">{req.storageName}</td>
                        <td className="p-4 flex items-center gap-1 text-slate-400"><Calendar className="w-3.5 h-3.5" /> {req.durationDays} days</td>
                        <td className="p-4 font-bold text-emerald-400">₹{req.price}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Orders Tab */}
      {localSubTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-200 text-left">B2B Sales Transactions</h2>
          
          {myOrders.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-400 space-y-3">
              <TrendingUp className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-light">No direct sourcing orders received from distributors yet.</p>
            </div>
          ) : (
            <div className="glass-panel border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Crop Type</th>
                      <th className="p-4">Sold Quantity (kg)</th>
                      <th className="p-4">Distributor Company</th>
                      <th className="p-4">Date Ordered</th>
                      <th className="p-4">Total Revenue</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {myOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/25 transition">
                        <td className="p-4 font-mono text-[10px] text-slate-400">{order.id}</td>
                        <td className="p-4 font-semibold text-slate-100">{order.cropType}</td>
                        <td className="p-4">{order.quantity} kg</td>
                        <td className="p-4 font-medium text-purple-400">{order.distributorName}</td>
                        <td className="p-4 text-slate-400">{new Date(order.dateOrdered).toLocaleString()}</td>
                        <td className="p-4 font-bold text-emerald-400">₹{order.totalPrice}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Geospatial Map Tab */}
      {localSubTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          <div className="lg:col-span-8 h-full">
            <MapContainer 
              center={[parseFloat(customLat), parseFloat(customLng)]} 
              onMapClick={handleMapClick}
              selectedCrop={crops}
              selectedStorage={storages}
              showAlerts={alerts}
              evacuationRoute={activeEvacuationRoute}
            />
          </div>
          
          {/* Quick Storage Directory Sidebar */}
          <div className="lg:col-span-4 glass-panel border-white/10 rounded-2xl p-4.5 space-y-4 overflow-y-auto h-full scrollbar text-left">
            <h3 className="text-sm font-bold text-slate-200 border-b border-white/15 pb-2 block">Local Cold Storage Facilities</h3>
            <div className="space-y-3">
              {storages.map(storage => {
                const freeCap = storage.totalCapacity - storage.occupiedCapacity;
                const freePct = Math.round((freeCap / storage.totalCapacity) * 100);
                return (
                  <div key={storage.id} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-blue-400">{storage.facilityName}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">📍 {storage.location.address}</p>
                      
                      <div className="w-full bg-slate-950/60 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, 100 - freePct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                        <span>Space Occupied: {100 - freePct}%</span>
                        <span className="font-bold text-emerald-400">{freeCap}kg Free</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                      <span className="text-amber-400 font-semibold">₹{storage.pricePerTonPerDay}/ton/day</span>
                      
                      {myCrops.length > 0 && (
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSendStorageRequest(storage.id, e.target.value, storage.facilityName);
                              e.target.value = ''; // Reset selection
                            }
                          }}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] uppercase tracking-wide border-none outline-none cursor-pointer"
                        >
                          <option value="">Store Crop...</option>
                          {myCrops.filter(c => c.status === 'Available').map(c => (
                            <option key={c.id} value={c.id}>{c.type} ({c.quantity}kg)</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Evacuation Tab */}
      {localSubTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Evacuation Options Console */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Disaster Evacuation Evacuation Planner</h3>
            
            {myCrops.filter(c => c.status === 'Available' || c.status === 'Stored').length === 0 ? (
              <div className="glass-panel border-white/5 rounded-2xl py-8 px-4 text-center text-slate-500">
                You have no available crops suitable for relocation at this moment.
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Select Affected Crop Yield</span>
                <div className="grid grid-cols-1 gap-2">
                  {myCrops.filter(c => c.status === 'Available' || c.status === 'Stored').map(crop => {
                    const isSelected = selectedCropForEvac?.id === crop.id;
                    return (
                      <button
                        key={crop.id}
                        onClick={() => handleQueryEvacOptions(crop)}
                        className={`w-full p-3 rounded-xl border text-left transition ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/40' 
                            : 'glass-panel border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-200">{crop.type}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{crop.quantity} kg</span>
                        </div>
                        <p className="text-[9px] text-slate-500 truncate mt-1">📍 {crop.location.address}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evacuation Routing Destinations */}
            {selectedCropForEvac && (
              <div className="space-y-3 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Select Nearest Safe Cold Storage</span>
                
                {evacOptionsLoading ? (
                  <div className="flex items-center justify-center p-6 text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Routing options...
                  </div>
                ) : evacOptions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 text-center leading-normal">
                    ⚠️ No eligible storage facility has enough capacity for this {selectedCropForEvac.quantity}kg crop stock!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar pr-1">
                    {evacOptions.map((opt) => {
                      const isRouteSelected = activeEvacuationRoute === opt.route;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => setActiveEvacuationRoute(opt.route)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            isRouteSelected 
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner' 
                              : 'glass-panel border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">{opt.facilityName}</h4>
                              <p className="text-[9px] text-slate-500 mt-0.5">📍 Distance: <span className="text-amber-400 font-bold">{opt.distance} km</span> | Transit: <span className="text-slate-300 font-bold">{opt.estimatedMinutes} mins</span></p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-emerald-400 block">Rate: ₹{opt.pricePerTonPerDay}/day</span>
                              <span className="text-[8px] text-slate-500 block mt-0.5">{opt.freeCapacity}kg space open</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                            <span className="text-[9px] text-slate-500">Route pre-plotted on map.</span>
                            
                            <button
                              disabled={relocateLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteEvac(opt);
                              }}
                              className="flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[9px] uppercase tracking-wide transition shadow-lg shadow-amber-500/10"
                            >
                              {relocateLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Evacuate Yield <ArrowRight className="w-3 h-3" /></>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mapping Evacuation Live Visualizer */}
          <div className="lg:col-span-7 h-[calc(100vh-160px)]">
            <MapContainer 
              center={selectedCropForEvac?.location ? [selectedCropForEvac.location.latitude, selectedCropForEvac.location.longitude] : [22.8, 88.4]}
              selectedCrop={selectedCropForEvac || crops}
              selectedStorage={storages}
              showAlerts={alerts}
              evacuationRoute={activeEvacuationRoute}
            />
          </div>

        </div>
      )}

    </div>
  );
};

export default FarmerDashboard;
