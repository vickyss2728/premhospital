import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/serviceController';
import { protect, authorizeOwner } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all service routes
router.use(protect);

router.route('/')
  .get(getServices)
  .post(authorizeOwner, createService);

router.route('/:id')
  .put(updateService)
  .delete(authorizeOwner, deleteService);

export default router;
