import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { resolveClientIp } from '../middleware/clientIp.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { submitAttendance, listAttendance } from '../controllers/attendanceController.js';

const router = Router();
const submitLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many submissions. Try again later.' },
});

router.post('/', submitLimit, resolveClientIp, submitAttendance);
router.get('/', adminAuth, listAttendance);

export default router;
