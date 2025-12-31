import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import clientsRoutes from './clients.routes';
import firmsRoutes from './firms.routes';
import tasksRoutes from './tasks.routes';
import invoicesRoutes from './invoices.routes';
import documentsRoutes from './documents.routes';
import approvalsRoutes from './approvals.routes';
import meetingsRoutes from './meetings.routes';
import usersRoutes from './users.routes';
import activityLogsRoutes from './activityLogs.routes';
import credentialsRoutes from './credentials.routes';
import subscriptionRoutes from './subscription.routes';
import complianceRoutes from './compliance.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clients', clientsRoutes);
router.use('/firms', firmsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/documents', documentsRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/meetings', meetingsRoutes);
router.use('/users', usersRoutes);
router.use('/activity-logs', activityLogsRoutes);
router.use('/credentials', credentialsRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/compliance', complianceRoutes);

export default router;

