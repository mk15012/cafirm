import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getEntityTypes,
  getStates,
  suggestFirmCompliances,
  saveFirmCompliances,
  getComplianceCalendar,
  getUpcomingDeadlines,
  getComplianceTypes,
} from '../controllers/compliance.controller';

const router = Router();

// Public reference data
router.get('/entity-types', getEntityTypes);
router.get('/states', getStates);
router.get('/types', getComplianceTypes);

// Protected routes
router.post('/suggest', authenticate, suggestFirmCompliances);
router.put('/firms/:id', authenticate, saveFirmCompliances);
router.get('/calendar', authenticate, getComplianceCalendar);
router.get('/upcoming', authenticate, getUpcomingDeadlines);

export default router;

