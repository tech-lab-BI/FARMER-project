import express from 'express';
import { getCrops, getMyCrops, createCrop, updateCrop, deleteCrop } from '../controllers/cropController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCrops)
  .post(protect, authorize('farmer'), createCrop);

router.route('/my')
  .get(protect, authorize('farmer'), getMyCrops);

router.route('/:id')
  .put(protect, authorize('farmer'), updateCrop)
  .delete(protect, authorize('farmer'), deleteCrop);

export default router;
