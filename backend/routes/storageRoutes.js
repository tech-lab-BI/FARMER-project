import express from 'express';
import { 
  getStorages, 
  getStorageProfile, 
  updateCapacity, 
  createStorageRequest, 
  getStorageRequests, 
  handleStorageRequest, 
  purchaseCrop, 
  getBuyOrders 
} from '../controllers/storageController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getStorages);
router.get('/profile', protect, authorize('storage'), getStorageProfile);
router.put('/capacity', protect, authorize('storage'), updateCapacity);

router.route('/request')
  .post(protect, authorize('farmer'), createStorageRequest)
  .get(protect, getStorageRequests);

router.put('/request/:id', protect, authorize('storage'), handleStorageRequest);

router.route('/buy')
  .post(protect, authorize('distributor'), purchaseCrop);

router.get('/buy-orders', protect, getBuyOrders);

export default router;
