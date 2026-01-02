import { Router } from 'express';
import { getTasks, getTask, createTask, updateTask, deleteTask, generateTaxTasks, generateNextYearTasks } from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Tax deadline task generation for INDIVIDUAL users
router.post('/generate-tax-tasks', generateTaxTasks);
router.post('/generate-next-year-tasks', generateNextYearTasks);

export default router;

