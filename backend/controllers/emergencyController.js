import { db } from '../config/db.js';

// Get active weather/disaster alerts
export const getAlerts = async (req, res) => {
  try {
    const alerts = await db.alerts.find({ active: true });
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Get Alerts Error:", error);
    res.status(500).json({ message: "Server error fetching active alerts" });
  }
};

// Create a simulated weather/disaster alert (System trigger)
export const createAlert = async (req, res) => {
  try {
    const { type, title, description, latitude, longitude, radiusKm, severity } = req.body;

    if (!type || !title || !description || !latitude || !longitude) {
      return res.status(400).json({ message: "Please provide alert type, title, description, and location coordinates" });
    }

    const alert = await db.alerts.create({
      type,
      title,
      description,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusKm: parseFloat(radiusKm) || 15
      },
      severity: severity || "High",
      dateCreated: new Date().toISOString(),
      active: true
    });

    // Send push notification via socket immediately to all connected clients
    if (global.io) {
      global.io.emit('emergencyAlert', alert);
    }

    res.status(201).json(alert);
  } catch (error) {
    console.error("Create Alert Error:", error);
    res.status(500).json({ message: "Server error creating emergency alert" });
  }
};

// Find relocation options for a crop affected by emergency
export const getRelocationOptions = async (req, res) => {
  try {
    const { cropId } = req.query;
    if (!cropId) {
      return res.status(400).json({ message: "Crop ID is required" });
    }

    const crop = await db.crops.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    const cropLat = crop.location.latitude;
    const cropLng = crop.location.longitude;

    // Distance calculation helper (Haversine formula)
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };

    // Find all storage facilities with enough free capacity
    const storages = await db.users.find({ role: 'storage' });
    const eligibleStorages = [];

    for (const storage of storages) {
      const freeCapacity = storage.totalCapacity - storage.occupiedCapacity;
      if (freeCapacity >= crop.quantity) {
        const distance = getDistance(cropLat, cropLng, storage.location.latitude, storage.location.longitude);
        
        // Mock route points for mapping visualizer (draws a smooth Bezier or a simple polyline path)
        // In Leaflet we can just use the coordinates directly. We'll provide them as a route array.
        const routePoints = [
          [cropLat, cropLng],
          // Generate a halfway curved coordinate for aesthetic polyline curves
          [(cropLat + storage.location.latitude) / 2 + 0.015, (cropLng + storage.location.longitude) / 2 - 0.015],
          [storage.location.latitude, storage.location.longitude]
        ];

        // Estimated transit speed 40km/h for rural roads during heavy rain
        const estimatedHours = distance / 40;
        const transitMinutes = Math.round(estimatedHours * 60);

        eligibleStorages.push({
          id: storage.id,
          facilityName: storage.facilityName,
          totalCapacity: storage.totalCapacity,
          freeCapacity,
          pricePerTonPerDay: storage.pricePerTonPerDay,
          location: storage.location,
          distance: Math.round(distance * 10) / 10,
          estimatedMinutes: transitMinutes,
          route: routePoints
        });
      }
    }

    // Sort by distance (closest first)
    eligibleStorages.sort((a, b) => a.distance - b.distance);

    res.status(200).json(eligibleStorages);
  } catch (error) {
    console.error("Get Relocation Options Error:", error);
    res.status(500).json({ message: "Server error getting relocation options" });
  }
};

// Confirm emergency relocation execution
export const executeRelocation = async (req, res) => {
  try {
    const { cropId, storageId, price } = req.body;

    if (!cropId || !storageId) {
      return res.status(400).json({ message: "Please provide crop ID and storage ID" });
    }

    const crop = await db.crops.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Verify ownership
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized crop relocation" });
    }

    const storage = await db.users.findById(storageId);
    if (!storage || storage.role !== 'storage') {
      return res.status(404).json({ message: "Storage facility not found" });
    }

    const freeCapacity = storage.totalCapacity - storage.occupiedCapacity;
    if (freeCapacity < crop.quantity) {
      return res.status(400).json({ message: "Target storage facility no longer has enough free capacity" });
    }

    // Execute relocation:
    // 1. Update storage occupied capacity
    await db.users.findByIdAndUpdate(storageId, {
      occupiedCapacity: storage.occupiedCapacity + crop.quantity
    });

    // 2. Update crop location and state
    const relocatedCrop = await db.crops.findByIdAndUpdate(cropId, {
      status: "Relocated",
      location: storage.location, // Moved to storage facility
      notes: `Relocated to ${storage.facilityName} due to disaster emergency.`
    });

    // 3. Create approved emergency storage request record
    const request = await db.requests.create({
      cropId,
      cropType: crop.type,
      quantity: crop.quantity,
      farmerId: req.user.id,
      farmerName: req.user.name,
      storageId,
      storageName: storage.facilityName,
      status: "Approved", // Pre-approved in emergencies
      price: parseFloat(price) || 0,
      durationDays: 14, // Default emergency duration
      dateRequested: new Date().toISOString(),
      isEmergency: true
    });

    // Notify online clients via socket
    if (global.io) {
      global.io.emit('cropRelocated', {
        crop: relocatedCrop,
        request,
        storageId
      });
    }

    res.status(200).json({
      message: `Crop successfully evacuated and relocated to ${storage.facilityName}.`,
      crop: relocatedCrop,
      request
    });
  } catch (error) {
    console.error("Execute Relocation Error:", error);
    res.status(500).json({ message: "Server error performing emergency relocation" });
  }
};
