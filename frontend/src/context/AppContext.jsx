import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AppContext = createContext();

// Mock fallback data for out-of-the-box preview if backend is offline
const MOCK_STORAGE = [
  {
    id: "u_storage_1",
    name: "Himachal Cold Storage",
    facilityName: "Himachal Alpine Cold Store",
    email: "himachal@storage.com",
    role: "storage",
    phone: "+91 98765 43212",
    location: { latitude: 31.1048, longitude: 77.1734, address: "Shimla, Himachal Pradesh" },
    totalCapacity: 5000,
    occupiedCapacity: 1200,
    pricePerTonPerDay: 15
  },
  {
    id: "u_storage_2",
    name: "Bengal Delta Cold Storage",
    facilityName: "Bengal Delta Agro-Storage",
    email: "bengal@storage.com",
    role: "storage",
    phone: "+91 98765 43213",
    location: { latitude: 22.9868, longitude: 88.4385, address: "Kalyani, West Bengal" },
    totalCapacity: 8000,
    occupiedCapacity: 4500,
    pricePerTonPerDay: 12
  }
];

const MOCK_CROPS = [
  {
    id: "crop_1",
    farmerId: "u_farmer_1",
    farmerName: "Rajesh Kumar",
    type: "Potato (Jyoti)",
    quantity: 1500,
    pricePerKg: 18,
    status: "Available",
    durationDays: 60,
    dateListed: "2026-06-25T12:00:00.000Z",
    location: { latitude: 22.8251, longitude: 88.3902, address: "Singur, West Bengal" }
  },
  {
    id: "crop_2",
    farmerId: "u_farmer_1",
    farmerName: "Rajesh Kumar",
    type: "Onion (Red)",
    quantity: 800,
    pricePerKg: 28,
    status: "Available",
    durationDays: 30,
    dateListed: "2026-06-26T14:30:00.000Z",
    location: { latitude: 22.8251, longitude: 88.3902, address: "Singur, West Bengal" }
  },
  {
    id: "crop_3",
    farmerId: "u_farmer_2",
    farmerName: "Sukhwinder Singh",
    type: "Wheat (Premium)",
    quantity: 5000,
    pricePerKg: 24,
    status: "Available",
    durationDays: 90,
    dateListed: "2026-06-27T08:15:00.000Z",
    location: { latitude: 30.7333, longitude: 76.7794, address: "Chandigarh, Punjab" }
  }
];

const MOCK_ALERTS = [
  {
    id: "alert_1",
    type: "Weather Warning",
    title: "Heavy Rainfall & Flood Alert",
    description: "Severe precipitation expected in Singur & Hooghly district over the next 48 hours. Flood risk high.",
    location: { latitude: 22.8251, longitude: 88.3902, radiusKm: 25 },
    severity: "High",
    dateCreated: "2026-06-28T09:00:00.000Z",
    active: true
  }
];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [crops, setCrops] = useState([]);
  const [storages, setStorages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [activeEvacuationRoute, setActiveEvacuationRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse token on startup to resume session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  // Handle Socket.IO connections
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket gateway');
      newSocket.emit('join', { userId: user.id, role: user.role });
    });

    // Real-Time Listeners
    newSocket.on('emergencyAlert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      addNotification({
        id: Date.now(),
        type: 'danger',
        title: `🚨 EMERGENCY: ${newAlert.title}`,
        message: newAlert.description,
        time: new Date().toLocaleTimeString()
      });
    });

    newSocket.on('newCropListed', (newCrop) => {
      setCrops(prev => [newCrop, ...prev.filter(c => c.id !== newCrop.id)]);
      if (user.role === 'distributor') {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: '🌾 New Crop Available',
          message: `${newCrop.farmerName} listed ${newCrop.quantity}kg of ${newCrop.type}.`,
          time: new Date().toLocaleTimeString()
        });
      }
    });

    newSocket.on('cropUpdated', (updatedCrop) => {
      setCrops(prev => prev.map(c => c.id === updatedCrop.id ? updatedCrop : c));
    });

    newSocket.on('newStorageRequest', (newReq) => {
      setRequests(prev => [newReq, ...prev.filter(r => r.id !== newReq.id)]);
      if (user.id === newReq.storageId) {
        addNotification({
          id: Date.now(),
          type: 'warning',
          title: '❄️ New Storage Request',
          message: `${newReq.farmerName} requests storage for ${newReq.quantity}kg of ${newReq.cropType}.`,
          time: new Date().toLocaleTimeString()
        });
      }
    });

    newSocket.on('storageRequestUpdated', (updatedReq) => {
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      
      // Update capacity in storage local list if capacity changed
      if (updatedReq.status === 'Approved') {
        setStorages(prev => prev.map(s => {
          if (s.id === updatedReq.storageId) {
            return { ...s, occupiedCapacity: s.occupiedCapacity + updatedReq.quantity };
          }
          return s;
        }));
      }

      if (user.id === updatedReq.farmerId) {
        const type = updatedReq.status === 'Approved' ? 'success' : 'danger';
        const icon = updatedReq.status === 'Approved' ? '✅' : '❌';
        addNotification({
          id: Date.now(),
          type,
          title: `${icon} Storage Request ${updatedReq.status}`,
          message: `${updatedReq.storageName} has ${updatedReq.status.toLowerCase()} your request for ${updatedReq.cropType}.`,
          time: new Date().toLocaleTimeString()
        });
        syncData();
      }
    });

    newSocket.on('newBuyOrder', (newOrder) => {
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      if (user.id === newOrder.farmerId) {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: '💰 Crop Reserved!',
          message: `${newOrder.distributorName} has purchased ${newOrder.quantity}kg of your ${newOrder.cropType}.`,
          time: new Date().toLocaleTimeString()
        });
        syncData();
      }
    });

    newSocket.on('cropRelocated', (payload) => {
      const { crop, request, storageId } = payload;
      
      // Update crops list
      setCrops(prev => prev.map(c => c.id === crop.id ? crop : c));
      // Update requests list
      setRequests(prev => [request, ...prev.filter(r => r.id !== request.id)]);
      
      // Update storage capacities
      setStorages(prev => prev.map(s => {
        if (s.id === storageId) {
          return { ...s, occupiedCapacity: s.occupiedCapacity + crop.quantity };
        }
        return s;
      }));

      if (user.id === crop.farmerId) {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: '🚚 Evacuation Relocation Completed!',
          message: `Your crops were successfully moved to ${request.storageName}.`,
          time: new Date().toLocaleTimeString()
        });
      } else if (user.id === storageId) {
        addNotification({
          id: Date.now(),
          type: 'danger',
          title: '🚨 Urgent Disaster Relocation Evacuation',
          message: `Emergency crop relocation from ${crop.farmerName} (${crop.quantity}kg of ${crop.type}) has arrived.`,
          time: new Date().toLocaleTimeString()
        });
      }
      syncData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Periodic and manual synchronization
  useEffect(() => {
    if (token && user) {
      syncData();
    } else {
      // Load mock items for preview immediately if not logged in
      setCrops(MOCK_CROPS);
      setStorages(MOCK_STORAGE);
      setAlerts(MOCK_ALERTS);
    }
  }, [token, user]);

  const syncData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Crops
      const resCrops = await fetch('/api/crops', { headers }).catch(() => null);
      if (resCrops && resCrops.ok) {
        const data = await resCrops.json();
        setCrops(data);
      } else {
        setCrops(MOCK_CROPS);
      }

      // Storage Facility Users
      const resStorage = await fetch('/api/storage', { headers }).catch(() => null);
      if (resStorage && resStorage.ok) {
        const data = await resStorage.json();
        setStorages(data);
      } else {
        setStorages(MOCK_STORAGE);
      }

      // Active Alerts
      const resAlerts = await fetch('/api/emergency/alerts', { headers }).catch(() => null);
      if (resAlerts && resAlerts.ok) {
        const data = await resAlerts.json();
        setAlerts(data);
      } else {
        setAlerts(MOCK_ALERTS);
      }

      // Requests (Role specific)
      const resReqs = await fetch('/api/storage/request', { headers }).catch(() => null);
      if (resReqs && resReqs.ok) {
        const data = await resReqs.json();
        setRequests(data);
      }

      // Buy orders
      const resOrders = await fetch('/api/storage/buy-orders', { headers }).catch(() => null);
      if (resOrders && resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }
    } catch (e) {
      console.warn("Failed to sync backend, maintaining offline mock models", e);
    }
  };

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev].slice(0, 20)); // Limit to last 20
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // API wrappers
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      addNotification({
        id: Date.now(),
        type: 'success',
        title: '🔑 Login Success',
        message: `Welcome back, ${data.user.name}!`,
        time: new Date().toLocaleTimeString()
      });
      return data.user;
    } catch (err) {
      // Local fallback for quick mock testing
      if (email === 'rajesh@farmer.com' && password === 'password') {
        const mockUser = {
          id: "u_farmer_1",
          name: "Rajesh Kumar",
          email: "rajesh@farmer.com",
          role: "farmer",
          phone: "+91 98765 43210",
          location: { latitude: 22.8251, longitude: 88.3902, address: "Singur, West Bengal" }
        };
        localStorage.setItem('token', 'mock_token_farmer');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken('mock_token_farmer');
        setUser(mockUser);
        return mockUser;
      } else if (email === 'himachal@storage.com' && password === 'password') {
        const mockUser = {
          id: "u_storage_1",
          name: "Himachal Cold Storage",
          email: "himachal@storage.com",
          role: "storage",
          phone: "+91 98765 43212",
          facilityName: "Himachal Alpine Cold Store",
          location: { latitude: 31.1048, longitude: 77.1734, address: "Shimla, Himachal Pradesh" },
          totalCapacity: 5000,
          occupiedCapacity: 1200,
          pricePerTonPerDay: 15
        };
        localStorage.setItem('token', 'mock_token_storage');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken('mock_token_storage');
        setUser(mockUser);
        return mockUser;
      } else if (email === 'aman@distributor.com' && password === 'password') {
        const mockUser = {
          id: "u_distributor_1",
          name: "Aman Logistics & Retail",
          email: "aman@distributor.com",
          role: "distributor",
          phone: "+91 98765 43214",
          companyName: "Aman Fresh Foods Ltd",
          location: { latitude: 22.5726, longitude: 88.3639, address: "Kolkata, West Bengal" }
        };
        localStorage.setItem('token', 'mock_token_distributor');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken('mock_token_distributor');
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    }
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setCrops([]);
    setRequests([]);
    setOrders([]);
    setActiveEvacuationRoute(null);
  };

  return (
    <AppContext.Provider value={{
      user,
      token,
      crops,
      storages,
      requests,
      orders,
      alerts,
      notifications,
      activeEvacuationRoute,
      loading,
      login,
      register,
      logout,
      syncData,
      addNotification,
      clearNotifications,
      setActiveEvacuationRoute,
      setCrops,
      setRequests,
      setStorages,
      setAlerts
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
