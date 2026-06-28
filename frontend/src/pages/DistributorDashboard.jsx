import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MapContainer from '../components/MapContainer';
import { 
  Sprout, 
  TrendingUp, 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  Truck, 
  ShoppingBag, 
  ArrowUpRight, 
  MapPin, 
  Phone
} from 'lucide-react';

const DistributorDashboard = ({ activeSubTab }) => {
  const { 
    user, 
    crops, 
    orders, 
    alerts, 
    token, 
    syncData, 
    addNotification 
  } = useApp();

  const [localSubTab, setLocalSubTab] = useState('sourcing'); // sourcing, reservations, map, emergency
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Filters State
  const [searchType, setSearchType] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxDistance, setMaxDistance] = useState('100'); // Distance in km

  // Purchase Form State
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState('');

  useEffect(() => {
    if (activeSubTab) {
      setLocalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Distance calculation helper (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedCrop || !buyQuantity) return;

    const orderQty = parseFloat(buyQuantity);
    if (orderQty <= 0 || orderQty > selectedCrop.quantity) {
      alert("Please enter a valid quantity within available stock limits.");
      return;
    }

    setPurchaseLoading(true);
    try {
      const res = await fetch('/api/storage/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropId: selectedCrop.id,
          quantity: orderQty
        })
      });

      if (res.ok) {
        setSelectedCrop(null);
        setBuyQuantity('');
        syncData();
        addNotification({
          id: Date.now(),
          type: 'success',
          title: '💰 Produce Reserved',
          message: `Successfully secured ${orderQty}kg of ${selectedCrop.type} directly from source.`,
          time: new Date().toLocaleTimeString()
        });
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to make reservation.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Filter crops: status = Available or Stored, quantity > 0
  const availableCrops = crops.filter(c => (c.status === 'Available' || c.status === 'Stored') && c.quantity > 0);

  // Apply filters
  const filteredCrops = availableCrops.filter(crop => {
    // 1. Search filter
    if (searchType && !crop.type.toLowerCase().includes(searchType.toLowerCase())) return false;

    // 2. Minimum quantity
    if (minQuantity && crop.quantity < parseFloat(minQuantity)) return false;

    // 3. Distance filter
    if (user && user.location && crop.location) {
      const distance = getDistance(
        user.location.latitude, 
        user.location.longitude, 
        crop.location.latitude, 
        crop.location.longitude
      );
      crop.distance = Math.round(distance * 10) / 10; // append distance field dynamically
      if (maxDistance && distance > parseFloat(maxDistance)) return false;
    }
    return true;
  });

  // Filter orders created by this distributor
  const myReservations = orders.filter(o => o.distributorId === user?.id);

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-57px)] lg:max-h-[calc(100vh-65px)]">
      
      {localSubTab === 'sourcing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Main Sourcing Marketplace */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Header with quick filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Direct Farm Sourcing Board</h2>
              <span className="text-xs text-slate-500 font-medium">{filteredCrops.length} Crops Matching</span>
            </div>

            {/* Filter Toolbar */}
            <div className="glass-panel border-white/5 rounded-xl p-3 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[180px] relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchType} 
                  onChange={e => setSearchType(e.target.value)} 
                  placeholder="Search crop variety..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="w-32">
                <input 
                  type="number" 
                  value={minQuantity} 
                  onChange={e => setMinQuantity(e.target.value)} 
                  placeholder="Min Quantity (kg)"
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Radius:</span>
                <select 
                  value={maxDistance} 
                  onChange={e => setMaxDistance(e.target.value)}
                  className="px-2 py-1 rounded glass-input text-xs cursor-pointer border-none"
                >
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                  <option value="500">500 km</option>
                  <option value="">Any distance</option>
                </select>
              </div>
            </div>

            {/* Marketplace Grid */}
            {filteredCrops.length === 0 ? (
              <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-400 space-y-3">
                <Sprout className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-light">No farm produce matching your criteria is listed on the grid right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCrops.map((crop) => (
                  <div 
                    key={crop.id} 
                    className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between h-48 border-white/10"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-slate-200">{crop.type}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          crop.status === 'Stored' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {crop.status === 'Stored' ? '❄️ Cold Stored' : '🚜 Farm Direct'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400 pt-0.5">
                        <p>Grower: <span className="font-semibold text-slate-200">{crop.farmerName}</span></p>
                        <p>Quantity: <span className="font-semibold text-slate-200">{crop.quantity} kg</span></p>
                        <p>Rate: <span className="font-bold text-amber-400">₹{crop.pricePerKg}/kg</span></p>
                        {crop.distance !== undefined && (
                          <p className="flex items-center gap-0.5 text-blue-400">
                            <MapPin className="w-3.5 h-3.5" /> {crop.distance} km away
                          </p>
                        )}
                        <p className="col-span-2 truncate text-[11px] text-slate-500 mt-1">📍 {crop.location.address}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Value: ₹{crop.quantity * crop.pricePerKg}</span>
                      
                      <button
                        onClick={() => {
                          setSelectedCrop(crop);
                          setBuyQuantity(crop.quantity.toString());
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase transition shadow-lg shadow-emerald-950/20"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Reserve Produce
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sourcing Reservations Sidebar */}
          <div className="lg:col-span-4">
            {selectedCrop ? (
              <div className="glass-panel border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/15 pb-2.5">
                  <h3 className="text-base font-bold text-slate-200">Instant Reservation</h3>
                  <button onClick={() => setSelectedCrop(null)} className="text-xs text-slate-500 hover:text-white">Cancel</button>
                </div>

                <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                  <p className="flex justify-between text-slate-400"><span>Variety:</span> <span className="font-semibold text-white">{selectedCrop.type}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Grower:</span> <span className="font-semibold text-white">{selectedCrop.farmerName}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Rate:</span> <span className="font-semibold text-amber-400">₹{selectedCrop.pricePerKg}/kg</span></p>
                  <p className="flex justify-between text-slate-400"><span>Max Available:</span> <span className="font-semibold text-white">{selectedCrop.quantity} kg</span></p>
                </div>

                <form onSubmit={handlePurchase} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity to Purchase (kg)</label>
                    <input 
                      type="number" 
                      required 
                      max={selectedCrop.quantity}
                      min="1"
                      value={buyQuantity} 
                      onChange={e => setBuyQuantity(e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>

                  <div className="border-t border-white/5 pt-3.5 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>₹{(parseFloat(buyQuantity) || 0) * selectedCrop.pricePerKg}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-100 text-sm">
                      <span>Total Invoice:</span>
                      <span className="text-emerald-400">₹{(parseFloat(buyQuantity) || 0) * selectedCrop.pricePerKg}</span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={purchaseLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2"
                  >
                    {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Truck className="w-4 h-4" /> Finalize Direct Reservation</>}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-panel border-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs font-light py-12 space-y-3">
                <Truck className="w-10 h-10 mx-auto text-slate-700" />
                <p>Select a crop variety from the sourcing board to configure instant direct B2B contract reservations bypassing middle agencies.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sourcing Reservations Tab */}
      {localSubTab === 'reservations' && (
        <div className="space-y-4 text-left">
          <h2 className="text-xl font-bold tracking-tight text-slate-200">Purchased Crop Invoices</h2>
          
          {myReservations.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-400 space-y-3">
              <TrendingUp className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-light">You haven't reserved or purchased any crops yet.</p>
            </div>
          ) : (
            <div className="glass-panel border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="p-4">Invoice ID</th>
                      <th className="p-4">Crop variety</th>
                      <th className="p-4">Purchased Volume</th>
                      <th className="p-4">Farmer / Grower</th>
                      <th className="p-4">Date Reserved</th>
                      <th className="p-4">Total Amount Paid</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {myReservations.map((resv) => (
                      <tr key={resv.id} className="hover:bg-slate-800/25 transition">
                        <td className="p-4 font-mono text-[10px] text-slate-400">{resv.id}</td>
                        <td className="p-4 font-semibold text-slate-100">{resv.cropType}</td>
                        <td className="p-4">{resv.quantity} kg</td>
                        <td className="p-4 font-medium text-emerald-400">{resv.farmerName}</td>
                        <td className="p-4 text-slate-400">{new Date(resv.dateOrdered).toLocaleString()}</td>
                        <td className="p-4 font-bold text-emerald-400">₹{resv.totalPrice}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Secured
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
        <div className="h-[calc(100vh-160px)]">
          <MapContainer 
            center={user?.location ? [user.location.latitude, user.location.longitude] : [22.8, 88.4]}
            selectedCrop={availableCrops}
            selectedStorage={[]}
            showAlerts={alerts}
          />
        </div>
      )}

      {/* Emergency Sourcing Alerts Tab */}
      {localSubTab === 'emergency' && (
        <div className="space-y-4 text-left">
          <h2 className="text-xl font-bold tracking-tight text-slate-200">Active Supply Warnings</h2>
          <p className="text-xs text-slate-400 max-w-2xl font-light">
            Monitor active disasters affecting regional crop availability. Yellow highlighting in the sourcing list alerts you to crops that are stored safely inside cold storage vaults.
          </p>

          {alerts.length === 0 ? (
            <div className="glass-panel border-white/5 rounded-2xl py-12 px-4 text-center text-slate-500 text-xs font-light">
              No active weather emergencies in the region.
            </div>
          ) : (
            <div className="divide-y divide-white/5 glass-panel border-white/10 rounded-xl">
              {alerts.map(a => (
                <div key={a.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-red-400 flex items-center gap-1.5">🚨 {a.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[8px] bg-red-500/25 border border-red-500/40 text-red-300 font-bold uppercase">High Hazard</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal">{a.description}</p>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>Coordinates: {a.location.latitude}, {a.location.longitude}</span>
                    <span>Zone size: {a.location.radiusKm} km</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default DistributorDashboard;
