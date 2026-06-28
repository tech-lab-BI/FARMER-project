import express from 'express';
import { 
  getAlerts, 
  createAlert, 
  getRelocationOptions, 
  executeRelocation 
} from '../controllers/emergencyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/alerts')
  .get(protect, getAlerts)
  .post(protect, createAlert); // Can be triggered by admins or automated weather hooks

router.get('/relocate-options', protect, getRelocationOptions);
router.post('/relocate', protect, executeRelocation);

export default router;
