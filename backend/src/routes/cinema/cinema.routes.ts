import { Router } from 'express';
import * as cinemaController from '../../controllers/cinema/cinema.controller';
import * as showController from '../../controllers/show/show.controller';

const router = Router();

// ===============================
// PUBLIC ROUTES
// ===============================

// GET /api/cinemas — Danh sách cụm rạp
router.get('/', cinemaController.getCinemas);

// GET /api/cinemas/:id — Chi tiết cụm rạp kèm phòng chiếu
router.get('/:id', cinemaController.getCinemaById);

// GET /api/cinemas/:id/shows — Lịch chiếu theo cụm rạp
router.get('/:id/shows', showController.getShowsByCinema);

export default router;
