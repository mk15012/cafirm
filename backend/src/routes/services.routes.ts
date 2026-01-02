import { Router } from 'express';
import { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  deleteService,
  seedDefaultServices 
} from '../controllers/services.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get all services (all authenticated users can view)
router.get('/', getServices);

// Get single service
router.get('/:id', getService);

// Only CA can manage services
router.post('/', authorize('CA'), createService);
router.post('/seed-defaults', authorize('CA'), seedDefaultServices);
router.put('/:id', authorize('CA'), updateService);
router.delete('/:id', authorize('CA'), deleteService);

export default router;

