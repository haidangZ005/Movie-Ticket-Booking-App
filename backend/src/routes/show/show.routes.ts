import { Router } from 'express';
import * as showController from '../../controllers/show/show.controller';

const router = Router();

// ===============================
// PUBLIC ROUTES
// ===============================

// GET /api/shows/:id — Chi tiết suất chiếu
router.get('/:id', showController.getShowById);

// GET /api/shows/:id/seats — Sơ đồ ghế kèm trạng thái realtime
router.get('/:id/seats', showController.getShowSeats);

export default router;
