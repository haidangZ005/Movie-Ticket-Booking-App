import SeatLayoutModel, { SeatLayoutItem } from '../models/seat-layout.model';

class SeatLayoutService {
    private static createBadRequest(message: string, errorCode: string) {
        const error: any = new Error(message);
        error.statusCode = 400;
        error.errorCode = errorCode;
        return error;
    }

    private static createConflict(message: string, errorCode: string) {
        const error: any = new Error(message);
        error.statusCode = 409;
        error.errorCode = errorCode;
        return error;
    }

    private static validateLayoutPayload(payload: {
        totalRows: number;
        totalCols: number;
        seats: SeatLayoutItem[];
    }) {
        const totalRows = Number(payload.totalRows);
        const totalCols = Number(payload.totalCols);
        const allowedTypes = new Set(['STANDARD', 'VIP', 'COUPLE', 'AISLE', 'DISABLED']);
        const positionSet = new Set<string>();
        const seatNumberSet = new Set<string>();

        if (!Number.isInteger(totalRows) || totalRows <= 0) {
            throw this.createBadRequest('Invalid total rows', 'INVALID_TOTAL_ROWS');
        }

        if (!Number.isInteger(totalCols) || totalCols <= 0) {
            throw this.createBadRequest('Invalid total columns', 'INVALID_TOTAL_COLS');
        }

        for (const seat of payload.seats) {
            const rowIndex = Number(seat.RowIndex);
            const colIndex = Number(seat.ColIndex);
            const seatType = seat.SeatType;
            const isAisle = Boolean(seat.IsAisle) || seatType === 'AISLE';

            if (!Number.isInteger(rowIndex) || rowIndex < 1 || rowIndex > totalRows) {
                throw this.createBadRequest('Seat row is outside layout size', 'INVALID_ROW_INDEX');
            }

            if (!Number.isInteger(colIndex) || colIndex < 1 || colIndex > totalCols) {
                throw this.createBadRequest('Seat column is outside layout size', 'INVALID_COL_INDEX');
            }

            const positionKey = `${rowIndex}:${colIndex}`;
            if (positionSet.has(positionKey)) {
                throw this.createBadRequest('Duplicated seat position', 'DUPLICATED_SEAT_POSITION');
            }
            positionSet.add(positionKey);

            if (!allowedTypes.has(seatType)) {
                throw this.createBadRequest('Invalid seat type', 'INVALID_SEAT_TYPE');
            }

            if (isAisle) {
                continue;
            }

            const seatNumber = String(seat.SeatNumber || '').trim();
            if (!seatNumber) {
                throw this.createBadRequest('Non-aisle seat must have seat number', 'MISSING_SEAT_NUMBER');
            }

            if (seatNumberSet.has(seatNumber)) {
                throw this.createBadRequest('Duplicated seat number', 'DUPLICATED_SEAT_NUMBER');
            }
            seatNumberSet.add(seatNumber);

            if (seatType !== 'COUPLE' && seat.PairID) {
                throw this.createBadRequest('Only couple seats can have PairID', 'INVALID_PAIR_ID');
            }
        }
    }

    static async getByHallId(hallId: number) {
        const hall = await SeatLayoutModel.getHallById(hallId);

        if (!hall) {
            const error: any = new Error('Phòng chiếu không tồn tại');
            error.statusCode = 404;
            error.errorCode = 'HALL_NOT_FOUND';
            throw error;
        }


        const seats = await SeatLayoutModel.getSeatsByHallId(hallId);

        return {
            hall,
            seats,
        };

    }

    static async replaceByHallId(hallId: number,
        payload: {
            totalRows: number;
            totalCols: number;
            seats: SeatLayoutItem[];
        }) {
        const hall = await SeatLayoutModel.getHallById(hallId);

        if (!hall) {
            const error: any = new Error('Phòng chiếu không tồn tại');
            error.statusCode = 404;
            error.errorCode = 'HALL_NOT_FOUND';
            throw error;
        }

        if (!Array.isArray(payload.seats)) {
            const error: any = new Error('Danh sách ghế không hợp lệ');
            error.statusCode = 400;
            error.errorCode = 'INVALID_SEATS';
            throw error;
        }

        if (!payload.totalRows || !payload.totalCols) {
            const error: any = new Error('Số hàng và số cột là bắt buộc');
            error.statusCode = 400;
            error.errorCode = 'INVALID_LAYOUT_SIZE';
            throw error;
        }

        this.validateLayoutPayload(payload);

        const hasSeatBookings = await SeatLayoutModel.hasSeatBookings(hallId);
        if (hasSeatBookings) {
            throw this.createConflict(
                'Cannot replace seat layout because this hall already has bookings',
                'SEAT_LAYOUT_HAS_BOOKINGS'
            );
        }

        return SeatLayoutModel.replaceHallSeats(hallId, payload);
    }
}

export default SeatLayoutService;
