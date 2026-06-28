import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sprout, Warehouse, Truck, LogIn, UserPlus, MapPin, Loader2, Sparkles, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('farmer'); // farmer, storage, distributor
  const [phone, setPhone] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [totalCapacity, setTotalCapacity] = useState('5000');
  const [pricePerTonPerDay, setPricePerTonPerDay] = useState('12');
  const [lat, setLat] = useState('22.8251'); // Default near Singur
  const [lng, setLng] = useState('88.3902');
  const [address, setAddress] = useState('Singur, Hooghly, West Bengal');

  const handleQuickLogin = async (e, quickEmail) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(quickEmail, 'password');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const payload = {
          name,
          email,
          password,
          role,
          phone,
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            address
          }
        };

        if (role === 'storage') {
          payload.facilityName = facilityName;
          payload.totalCapacity = parseFloat(totalCapacity);
          payload.pricePerTonPerDay = parseFloat(pricePerTonPerDay);
        } else if (role === 'distributor') {
          payload.companyName = companyName;
        }

        await register(payload);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-57px)] flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-slate-950">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left Side: Pitch and Seed Details */}
        <div className="lg:col-span-7 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Climate-Smart Agricultural Network
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Connecting <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Farms</span> directly to <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Cold Storages</span> & <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Retailers</span>
          </h1>
          
          <p className="text-slate-400 text-base max-w-xl font-light leading-relaxed">
            AgriLink protects crop yields from severe weather hazards, coordinates automated routing evacuations, and eliminates monopolistic supply middlemen via direct B2B smart scheduling.
          </p>

          {/* Quick Seed Users Login */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demo Quick Access Gateways</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={(e) => handleQuickLogin(e, 'rajesh@farmer.com')}
                disabled={loading}
                className="flex items-center gap-2.5 p-3 rounded-xl glass-panel border-emerald-500/20 hover:border-emerald-500/40 text-left group transition duration-200"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-400">Rajesh Kumar</h4>
                  <p className="text-[9px] text-slate-500">Role: Farmer</p>
                </div>
              </button>

              <button 
                onClick={(e) => handleQuickLogin(e, 'himachal@storage.com')}
                disabled={loading}
                className="flex items-center gap-2.5 p-3 rounded-xl glass-panel border-blue-500/20 hover:border-blue-500/40 text-left group transition duration-200"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-400">Shimla Storage</h4>
                  <p className="text-[9px] text-slate-500">Role: Storage Node</p>
                </div>
              </button>

              <button 
                onClick={(e) => handleQuickLogin(e, 'aman@distributor.com')}
                disabled={loading}
                className="flex items-center gap-2.5 p-3 rounded-xl glass-panel border-purple-500/20 hover:border-purple-500/40 text-left group transition duration-200"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-400">Aman Logistics</h4>
                  <p className="text-[9px] text-slate-500">Role: Distributor</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 italic">Password for all seed users is <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded font-mono">password</code>. Or click any button above to sign in instantly.</p>
          </div>
        </div>

        {/* Right Side: Glassmorphism Auth Panel */}
        <div className="lg:col-span-5">
          <div className="glass-panel border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${isLogin ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500'}`}
              >
                <span className="flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${!isLogin ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500'}`}
              >
                <span className="flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Register</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Name (Registration Only) */}
              {!isLogin && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Rajesh Kumar" 
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="e.g. email@domain.com" 
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              {/* Role & Specific Settings (Registration Only) */}
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Role</label>
                      <select 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs capitalize cursor-pointer"
                      >
                        <option value="farmer">Farmer</option>
                        <option value="storage">Storage Provider</option>
                        <option value="distributor">Distributor</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        required 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="+91 XXXXX XXXXX" 
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Role Specific Panels */}
                  {role === 'storage' && (
                    <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/30 space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Facility Name</label>
                        <input 
                          type="text" 
                          required 
                          value={facilityName} 
                          onChange={e => setFacilityName(e.target.value)} 
                          placeholder="e.g. Apex Cold Storage" 
                          className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Capacity (kg)</label>
                          <input 
                            type="number" 
                            required 
                            value={totalCapacity} 
                            onChange={e => setTotalCapacity(e.target.value)} 
                            className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Price / Ton / Day</label>
                          <input 
                            type="number" 
                            required 
                            value={pricePerTonPerDay} 
                            onChange={e => setPricePerTonPerDay(e.target.value)} 
                            className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {role === 'distributor' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Name</label>
                      <input 
                        type="text" 
                        required 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                        placeholder="e.g. FreshFood Chain Co" 
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                      />
                    </div>
                  )}

                  {/* Coordinates Selection */}
                  <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/30 space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Geospatial Coordinates</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 block mb-0.5">Latitude</label>
                        <input 
                          type="text" 
                          required 
                          value={lat} 
                          onChange={e => setLat(e.target.value)} 
                          className="w-full px-2 py-1 rounded glass-input text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 block mb-0.5">Longitude</label>
                        <input 
                          type="text" 
                          required 
                          value={lng} 
                          onChange={e => setLng(e.target.value)} 
                          className="w-full px-2 py-1 rounded glass-input text-[11px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-medium text-slate-500 block mb-0.5">Location Address</label>
                      <input 
                        type="text" 
                        required 
                        value={address} 
                        onChange={e => setAddress(e.target.value)} 
                        placeholder="Singur, Hooghly, West Bengal"
                        className="w-full px-2.5 py-1.5 rounded glass-input text-[11px]"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:translate-y-0.5 transition duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In to Console' : 'Complete Registration'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
