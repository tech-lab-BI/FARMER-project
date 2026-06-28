import { db } from '../config/db.js';

// Get list of all cold storage facilities (for geospatial searches)
export const getStorages = async (req, res) => {
  try {
    const users = await db.users.find({ role: 'storage' });
    const storages = users.map(user => {
      const { password: _, ...storageInfo } = user;
      return storageInfo;
    });
    res.status(200).json(storages);
  } catch (error) {
    console.error("Get Storages Error:", error);
    res.status(500).json({ message: "Server error fetching storage facilities" });
  }
};

// Get current storage provider's capacity profile
export const getStorageProfile = async (req, res) => {
  try {
    const storage = await db.users.findById(req.user.id);
    if (!storage || storage.role !== 'storage') {
      return res.status(404).json({ message: "Storage facility not found" });
    }
    const { password: _, ...storageInfo } = storage;
    res.status(200).json(storageInfo);
  } catch (error) {
    console.error("Get Storage Profile Error:", error);
    res.status(500).json({ message: "Server error fetching capacity profile" });
  }
};

// Update storage capacity metrics (Total, Occupied, Prices, Discounts)
export const updateCapacity = async (req, res) => {
  try {
    const { totalCapacity, occupiedCapacity, pricePerTonPerDay, discountPct } = req.body;
    const storage = await db.users.findById(req.user.id);

    if (!storage || storage.role !== 'storage') {
      return res.status(404).json({ message: "Storage facility not found" });
    }

    const updates = {};
    if (totalCapacity !== undefined) updates.totalCapacity = parseFloat(totalCapacity);
    if (occupiedCapacity !== undefined) updates.occupiedCapacity = parseFloat(occupiedCapacity);
    if (pricePerTonPerDay !== undefined) updates.pricePerTonPerDay = parseFloat(pricePerTonPerDay);
    if (discountPct !== undefined) updates.discountPct = parseFloat(discountPct); // Optional off-peak discount

    const updatedStorage = await db.users.findByIdAndUpdate(req.user.id, updates);
    const { password: _, ...storageInfo } = updatedStorage;

    // Broadcast capacity update to farmers on mapping console
    if (global.io) {
      global.io.emit('storageCapacityUpdated', {
        id: req.user.id,
        facilityName: storageInfo.facilityName,
        totalCapacity: storageInfo.totalCapacity,
        occupiedCapacity: storageInfo.occupiedCapacity,
        freeCapacity: Math.max(0, storageInfo.totalCapacity - storageInfo.occupiedCapacity)
      });
    }

    res.status(200).json(storageInfo);
  } catch (error) {
    console.error("Update Capacity Error:", error);
    res.status(500).json({ message: "Server error updating capacity metrics" });
  }
};

// Farmer sends request to cold storage
export const createStorageRequest = async (req, res) => {
  try {
    const { cropId, storageId, durationDays } = req.body;

    if (!cropId || !storageId || !durationDays) {
      return res.status(400).json({ message: "Please provide crop, storage facility, and duration" });
    }

    const crop = await db.crops.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    const storage = await db.users.findById(storageId);
    if (!storage || storage.role !== 'storage') {
      return res.status(404).json({ message: "Storage facility not found" });
    }

    // Verify ownership
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ message: "You don't own this crop" });
    }

    // Calculate approximate price: (quantity in kg / 1000) * pricePerTonPerDay * durationDays
    const quantityTons = crop.quantity / 1000;
    let basePrice = quantityTons * storage.pricePerTonPerDay * parseInt(durationDays);
    if (storage.discountPct) {
      basePrice = basePrice * (1 - storage.discountPct / 100);
    }
    const finalPrice = Math.round(basePrice * 100) / 100;

    const request = await db.requests.create({
      cropId,
      cropType: crop.type,
      quantity: crop.quantity,
      farmerId: req.user.id,
      farmerName: req.user.name,
      storageId,
      storageName: storage.facilityName,
      status: "Pending",
      price: finalPrice,
      durationDays: parseInt(durationDays),
      dateRequested: new Date().toISOString()
    });

    if (global.io) {
      global.io.emit('newStorageRequest', request);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error("Create Storage Request Error:", error);
    res.status(500).json({ message: "Server error creating storage request" });
  }
};

// Get requests (role-based)
export const getStorageRequests = async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'farmer') {
      requests = await db.requests.find({ farmerId: req.user.id });
    } else if (req.user.role === 'storage') {
      requests = await db.requests.find({ storageId: req.user.id });
    } else {
      requests = await db.requests.find();
    }
    res.status(200).json(requests);
  } catch (error) {
    console.error("Get Storage Requests Error:", error);
    res.status(500).json({ message: "Server error fetching requests" });
  }
};

// Storage updates request status (Accept / Reject)
export const handleStorageRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const requestId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const request = await db.requests.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Storage request not found" });
    }

    if (request.storageId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to handle this request" });
    }

    const storage = await db.users.findById(req.user.id);

    if (status === 'Approved') {
      // Check capacity
      const freeCapacity = storage.totalCapacity - storage.occupiedCapacity;
      if (freeCapacity < request.quantity) {
        return res.status(400).json({ message: "Insufficient storage capacity to accommodate this request" });
      }

      // Update storage occupied capacity
      await db.users.findByIdAndUpdate(req.user.id, {
        occupiedCapacity: storage.occupiedCapacity + request.quantity
      });

      // Update crop status
      await db.crops.findByIdAndUpdate(request.cropId, {
        status: "Stored"
      });
    }

    const updatedRequest = await db.requests.findByIdAndUpdate(requestId, { status });

    if (global.io) {
      global.io.emit('storageRequestUpdated', updatedRequest);
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error("Handle Storage Request Error:", error);
    res.status(500).json({ message: "Server error handling request" });
  }
};

// Distributor reserves/buys crop from farmer
export const purchaseCrop = async (req, res) => {
  try {
    const { cropId, quantity } = req.body;

    if (!cropId || !quantity) {
      return res.status(400).json({ message: "Please provide crop details and reservation quantity" });
    }

    const crop = await db.crops.findById(cropId);
    if (!crop || (crop.status !== 'Available' && crop.status !== 'Stored')) {
      return res.status(404).json({ message: "Crop not available for purchase" });
    }

    const orderQty = parseFloat(quantity);
    if (crop.quantity < orderQty) {
      return res.status(400).json({ message: "Requested quantity exceeds available crop stock" });
    }

    const distributor = await db.users.findById(req.user.id);

    const totalPrice = orderQty * crop.pricePerKg;

    // Create buy order
    const order = await db.buyOrders.create({
      cropId,
      cropType: crop.type,
      quantity: orderQty,
      farmerId: crop.farmerId,
      farmerName: crop.farmerName,
      distributorId: req.user.id,
      distributorName: distributor.name,
      status: "Approved", // Approved immediately for B2B direct buy
      totalPrice,
      dateOrdered: new Date().toISOString()
    });

    // Update crop quantity or mark as sold
    const remainingQty = crop.quantity - orderQty;
    if (remainingQty <= 0) {
      await db.crops.findByIdAndUpdate(cropId, {
        quantity: 0,
        status: "Sold"
      });
    } else {
      await db.crops.findByIdAndUpdate(cropId, {
        quantity: remainingQty
      });
    }

    if (global.io) {
      global.io.emit('newBuyOrder', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Purchase Crop Error:", error);
    res.status(500).json({ message: "Server error purchasing crop" });
  }
};

// Get buy orders
export const getBuyOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'farmer') {
      orders = await db.buyOrders.find({ farmerId: req.user.id });
    } else if (req.user.role === 'distributor') {
      orders = await db.buyOrders.find({ distributorId: req.user.id });
    } else {
      orders = await db.buyOrders.find();
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Buy Orders Error:", error);
    res.status(500).json({ message: "Server error retrieving orders" });
  }
};
