import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, location, facilityName, companyName, totalCapacity, pricePerTonPerDay } = req.body;

    // Validate request
    if (!name || !email || !password || !role || !location) {
      return res.status(400).json({ message: "Please enter all required fields" });
    }

    // Check if user exists
    const userExists = await db.users.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare role-specific fields
    const userPayload = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role, // 'farmer', 'storage', 'distributor'
      phone,
      location: {
        latitude: parseFloat(location.latitude) || 0,
        longitude: parseFloat(location.longitude) || 0,
        address: location.address || ""
      }
    };

    if (role === 'storage') {
      userPayload.facilityName = facilityName || `${name}'s Cold Storage`;
      userPayload.totalCapacity = parseFloat(totalCapacity) || 1000; // in kg
      userPayload.occupiedCapacity = 0;
      userPayload.pricePerTonPerDay = parseFloat(pricePerTonPerDay) || 10;
    } else if (role === 'distributor') {
      userPayload.companyName = companyName || `${name} Logistics`;
    }

    // Create user
    const newUser = await db.users.create(userPayload);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Return user info (except password) and token
    const { password: _, ...userInfo } = newUser;
    res.status(201).json({
      token,
      user: userInfo
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    const { password: _, ...userInfo } = user;
    res.status(200).json({
      token,
      user: userInfo
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...userInfo } = user;
    res.status(200).json(userInfo);
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};
