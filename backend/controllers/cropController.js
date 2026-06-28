import { db } from '../config/db.js';

// Get all crops with optional filtering
export const getCrops = async (req, res) => {
  try {
    const { type, minQty, lat, lng, radius } = req.query;
    let crops = await db.crops.find({ status: 'Available' });

    // Filter by type
    if (type) {
      crops = crops.filter(crop => crop.type.toLowerCase().includes(type.toLowerCase()));
    }

    // Filter by minimum quantity
    if (minQty) {
      crops = crops.filter(crop => crop.quantity >= parseInt(minQty));
    }

    // Geofiltering (if coordinates and radius in km are provided)
    if (lat && lng && radius) {
      const originLat = parseFloat(lat);
      const originLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

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

      crops = crops.filter(crop => {
        if (!crop.location || !crop.location.latitude) return false;
        const distance = getDistance(originLat, originLng, crop.location.latitude, crop.location.longitude);
        crop.distance = Math.round(distance * 10) / 10; // append distance field
        return distance <= radiusKm;
      });
    }

    res.status(200).json(crops);
  } catch (error) {
    console.error("Get Crops Error:", error);
    res.status(500).json({ message: "Server error fetching crops" });
  }
};

// Get current farmer's crops
export const getMyCrops = async (req, res) => {
  try {
    const crops = await db.crops.find({ farmerId: req.user.id });
    res.status(200).json(crops);
  } catch (error) {
    console.error("Get My Crops Error:", error);
    res.status(500).json({ message: "Server error fetching farmer crops" });
  }
};

// Create a crop listing
export const createCrop = async (req, res) => {
  try {
    const { type, quantity, pricePerKg, durationDays, location } = req.body;

    if (!type || !quantity || !pricePerKg) {
      return res.status(400).json({ message: "Please provide crop type, quantity and price" });
    }

    const farmer = await db.users.findById(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Default to farmer's location if not supplied in listing
    const cropLocation = location && location.latitude ? {
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      address: location.address || farmer.location.address
    } : farmer.location;

    const newCrop = await db.crops.create({
      farmerId: farmer.id,
      farmerName: farmer.name,
      type,
      quantity: parseFloat(quantity),
      pricePerKg: parseFloat(pricePerKg),
      durationDays: parseInt(durationDays) || 30,
      status: "Available",
      dateListed: new Date().toISOString(),
      location: cropLocation
    });

    // Notify online distributors via socket if initialized
    if (global.io) {
      global.io.emit('newCropListed', newCrop);
    }

    res.status(201).json(newCrop);
  } catch (error) {
    console.error("Create Crop Error:", error);
    res.status(500).json({ message: "Server error listing crop" });
  }
};

// Update a crop listing
export const updateCrop = async (req, res) => {
  try {
    const { type, quantity, pricePerKg, durationDays, status } = req.body;
    const crop = await db.crops.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Verify ownership
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this crop" });
    }

    const updatedCrop = await db.crops.findByIdAndUpdate(req.params.id, {
      type: type || crop.type,
      quantity: quantity !== undefined ? parseFloat(quantity) : crop.quantity,
      pricePerKg: pricePerKg !== undefined ? parseFloat(pricePerKg) : crop.pricePerKg,
      durationDays: durationDays !== undefined ? parseInt(durationDays) : crop.durationDays,
      status: status || crop.status
    });

    if (global.io) {
      global.io.emit('cropUpdated', updatedCrop);
    }

    res.status(200).json(updatedCrop);
  } catch (error) {
    console.error("Update Crop Error:", error);
    res.status(500).json({ message: "Server error updating crop" });
  }
};

// Delete a crop listing
export const deleteCrop = async (req, res) => {
  try {
    const crop = await db.crops.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Verify ownership
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this crop" });
    }

    await db.crops.findByIdAndDelete(req.params.id);

    if (global.io) {
      global.io.emit('cropDeleted', req.params.id);
    }

    res.status(200).json({ message: "Crop listing deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Delete Crop Error:", error);
    res.status(500).json({ message: "Server error deleting crop" });
  }
};
