import { Router } from 'express';
import * as cinemaController from '../../controllers/cinema/cinema.controller';
import * as showController from '../../controllers/show/show.controller';

const router = Router();

router.get('/', cinemaController.getCinemas);
router.get('/cities', cinemaController.getCities);
router.get('/:id', cinemaController.getCinemaById);
router.get('/:id/shows', showController.getShowsByCinema);

export default router;
