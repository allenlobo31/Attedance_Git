import { Router } from 'express';
import { resolveClientIp } from '../middleware/clientIp.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { submitAttendance, listAttendance } from '../controllers/attendanceController.js';

const router = Router();

router.post('/', resolveClientIp, submitAttendance);
router.get('/', adminAuth, listAttendance);

export default router;
