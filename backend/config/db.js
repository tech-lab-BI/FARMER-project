import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize database data structure
const initialData = {
  users: [
    {
      id: "u_farmer_1",
      name: "Rajesh Kumar",
      email: "rajesh@farmer.com",
      password: "$2a$10$WpQpG7hXvFvxI4zSUp7yG.g4z0eHk/5888Nl7c3rF75Gv.266wPae", // password is "password"
      role: "farmer",
      phone: "+91 98765 43210",
      location: { latitude: 22.8251, longitude: 88.3902, address: "Singur, West Bengal" }
    },
    {
      id: "u_farmer_2",
      name: "Sukhwinder Singh",
      email: "sukhwinder@farmer.com",
      password: "$2a$10$WpQpG7hXvFvxI4zSUp7yG.g4z0eHk/5888Nl7c3rF75Gv.266wPae", // password
      role: "farmer",
      phone: "+91 98765 43211",
      location: { latitude: 30.7333, longitude: 76.7794, address: "Chandigarh, Punjab" }
    },
    {
      id: "u_storage_1",
      name: "Himachal Cold Storage",
      email: "himachal@storage.com",
      password: "$2a$10$WpQpG7hXvFvxI4zSUp7yG.g4z0eHk/5888Nl7c3rF75Gv.266wPae", // password
      role: "storage",
      phone: "+91 98765 43212",
      facilityName: "Himachal Alpine Cold Store",
      location: { latitude: 31.1048, longitude: 77.1734, address: "Shimla, Himachal Pradesh" },
      totalCapacity: 5000,
      occupiedCapacity: 1200,
      pricePerTonPerDay: 15
    },
    {
      id: "u_storage_2",
      name: "Bengal Delta Cold Storage",
      email: "bengal@storage.com",
      password: "$2a$10$WpQpG7hXvFvxI4zSUp7yG.g4z0eHk/5888Nl7c3rF75Gv.266wPae", // password
      role: "storage",
      phone: "+91 98765 43213",
      facilityName: "Bengal Delta Agro-Storage",
      location: { latitude: 22.9868, longitude: 88.4385, address: "Kalyani, West Bengal" },
      totalCapacity: 8000,
      occupiedCapacity: 4500,
      pricePerTonPerDay: 12
    },
    {
      id: "u_distributor_1",
      name: "Aman Logistics & Retail",
      email: "aman@distributor.com",
      password: "$2a$10$WpQpG7hXvFvxI4zSUp7yG.g4z0eHk/5888Nl7c3rF75Gv.266wPae", // password
      role: "distributor",
      phone: "+91 98765 43214",
      companyName: "Aman Fresh Foods Ltd",
      location: { latitude: 22.5726, longitude: 88.3639, address: "Kolkata, West Bengal" }
    }
  ],
  crops: [
    {
      id: "crop_1",
      farmerId: "u_farmer_1",
      farmerName: "Rajesh Kumar",
      type: "Potato (Jyoti)",
      quantity: 1500, // in kg
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
      quantity: 800, // in kg
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
      quantity: 5000, // in kg
      pricePerKg: 24,
      status: "Available",
      durationDays: 90,
      dateListed: "2026-06-27T08:15:00.000Z",
      location: { latitude: 30.7333, longitude: 76.7794, address: "Chandigarh, Punjab" }
    }
  ],
  requests: [
    {
      id: "req_1",
      cropId: "crop_1",
      cropType: "Potato (Jyoti)",
      quantity: 1500,
      farmerId: "u_farmer_1",
      farmerName: "Rajesh Kumar",
      storageId: "u_storage_2",
      storageName: "Bengal Delta Agro-Storage",
      status: "Pending", // Pending, Approved, Rejected
      price: 18000, // 1.5 tons * 12 price * 10 days, etc.
      durationDays: 10,
      dateRequested: "2026-06-27T10:00:00.000Z"
    }
  ],
  buyOrders: [
    {
      id: "order_1",
      cropId: "crop_2",
      cropType: "Onion (Red)",
      quantity: 500,
      farmerId: "u_farmer_1",
      farmerName: "Rajesh Kumar",
      distributorId: "u_distributor_1",
      distributorName: "Aman Logistics & Retail",
      status: "Approved", // Pending, Approved, Completed, Cancelled
      totalPrice: 14000,
      dateOrdered: "2026-06-27T16:00:00.000Z"
    }
  ],
  alerts: [
    {
      id: "alert_1",
      type: "Weather Warning",
      title: "Heavy Rainfall & Flood Alert",
      description: "Severe precipitation expected in Singur & Hooghly district over the next 48 hours. Flood risk high.",
      location: { latitude: 22.8251, longitude: 88.3902, radiusKm: 20 },
      severity: "High",
      dateCreated: "2026-06-28T09:00:00.000Z",
      active: true
    }
  ]
};

// JSON Database Helper Class
class JSONDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      console.log('Local JSON Database initialized with seed data.');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading JSON db file, returning empty templates", e);
      return initialData;
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error writing JSON db file", e);
    }
  }

  collection(name) {
    const self = this;
    return {
      find: async (query = {}) => {
        const db = self.read();
        let items = db[name] || [];
        return items.filter(item => {
          for (let key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        });
      },
      findOne: async (query = {}) => {
        const db = self.read();
        const items = db[name] || [];
        return items.find(item => {
          for (let key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        });
      },
      findById: async (id) => {
        const db = self.read();
        const items = db[name] || [];
        return items.find(item => item.id === id);
      },
      create: async (data) => {
        const db = self.read();
        if (!db[name]) db[name] = [];
        const newItem = { id: `${name.substring(0, 3)}_${Date.now()}`, ...data };
        db[name].push(newItem);
        self.write(db);
        return newItem;
      },
      findByIdAndUpdate: async (id, updates) => {
        const db = self.read();
        const items = db[name] || [];
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates };
        self.write(db);
        return items[index];
      },
      findByIdAndDelete: async (id) => {
        const db = self.read();
        const items = db[name] || [];
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return false;
        const deleted = items.splice(index, 1);
        self.write(db);
        return deleted[0];
      }
    };
  }
}

export const localDB = new JSONDatabase();

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI);
      console.log('MongoDB Atlas Connected successfully.');
      return true;
    } catch (err) {
      console.error('MongoDB connection error. Falling back to Local JSON database...', err.message);
      return false;
    }
  } else {
    console.log('No MONGO_URI specified. Operating in Local JSON database mode.');
    return false;
  }
};

// Export interfaces for easy access
export const db = {
  users: localDB.collection('users'),
  crops: localDB.collection('crops'),
  requests: localDB.collection('requests'),
  buyOrders: localDB.collection('buyOrders'),
  alerts: localDB.collection('alerts')
};
