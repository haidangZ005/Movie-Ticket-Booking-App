import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import SeatLayoutService from '../../services/seat-layout.service';

export const getHallSeatLayout = asyncHandler(async (req: Request, res: Response) => {
    const hallId = Number(req.params.hallId);
    const layout = await SeatLayoutService.getByHallId(hallId);

    return res.status(200).json(
        ApiResponse.success(ResponseCode.SUCCESS, layout)
    );
});

export const updateHallSeatLayout = asyncHandler(async (req: Request, res: Response) => {
    const hallId = Number(req.params.hallId);
    const result = await SeatLayoutService.replaceByHallId(hallId, req.body);

    return res.status(200).json(
        ApiResponse.success(ResponseCode.SUCCESS, result)
    );
});