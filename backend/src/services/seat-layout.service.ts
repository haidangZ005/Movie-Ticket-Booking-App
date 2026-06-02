import SeatLayoutModel, { SeatLayoutItem } from '../models/seat-layout.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

class SeatLayoutService {
    private static createBadRequest(message: string, errorCode: string) {
        return new AppException({
            code: 4000,
            message: message,
            statusCode: 400
        });
    }

    private static createConflict(message: string, errorCode: string) {
        return new AppException({
            code: 4090,
            message: message,
            statusCode: 409
        });
    }

    private static validateLayoutPayload(payload: {
        totalRows: number;
        totalCols: number;
        seats: SeatLayoutItem[];
    }) {
        const totalRows = Number(payload.totalRows);
        const totalCols = Number(payload.totalCols);
        const allowedTypes = new Set(['STANDARD', 'VIP', 'COUPLE', 'AISLE', 'DISABLED', 'EMPTY']);
        const nonBookableTypes = new Set(['AISLE', 'DISABLED', 'EMPTY']);
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
            const isBookableSeat = !Boolean(seat.IsAisle) && !nonBookableTypes.has(seatType);

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

            if (!isBookableSeat) {
                if (seatType !== 'COUPLE' && seat.PairID) {
                    throw this.createBadRequest('Only couple seats can have PairID', 'INVALID_PAIR_ID');
                }
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

    private static normalizeLayoutPayload(payload: {
        totalRows: number;
        totalCols: number;
        seats: SeatLayoutItem[];
    }) {
        const nonBookableTypes = new Set(['AISLE', 'DISABLED', 'EMPTY']);

        return {
            ...payload,
            seats: payload.seats.map((seat) => {
                const seatType = seat.SeatType;
                const isBookableSeat = !Boolean(seat.IsAisle) && !nonBookableTypes.has(seatType);

                if (!isBookableSeat) {
                    return {
                        ...seat,
                        SeatNumber: '',
                        PairID: null,
                        SeatPrice: 0,
                        IsAisle: seatType === 'AISLE' || Boolean(seat.IsAisle),
                    };
                }

                return {
                    ...seat,
                    SeatNumber: String(seat.SeatNumber || '').trim(),
                    IsAisle: false,
                };
            }),
        };
    }

    static async getByHallId(hallId: number) {
        const hall = await SeatLayoutModel.getHallById(hallId);

        if (!hall) {
            throw new AppException(ErrorCode.HALL_NOT_FOUND);
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
            throw new AppException(ErrorCode.HALL_NOT_FOUND);
        }

        if (!Array.isArray(payload.seats)) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        if (!payload.totalRows || !payload.totalCols) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        this.validateLayoutPayload(payload);
        const normalizedPayload = this.normalizeLayoutPayload(payload);

        const hasSeatBookings = await SeatLayoutModel.hasSeatBookings(hallId);
        if (hasSeatBookings) {
            throw this.createConflict(
                'Cannot replace seat layout because this hall already has bookings',
                'SEAT_LAYOUT_HAS_BOOKINGS'
            );
        }

        return SeatLayoutModel.replaceHallSeats(hallId, normalizedPayload);
    }
}

export default SeatLayoutService;
