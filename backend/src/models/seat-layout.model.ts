import * as mssql from 'mssql';
import { connectDB } from '../config/database';

export interface SeatLayoutItem {
    SeatID?: number;
    HallID?: number;
    SeatNumber?: string | null;
    SeatType: 'STANDARD' | 'VIP' | 'COUPLE' | 'AISLE' | 'DISABLED';
    SeatPrice?: number;
    PairID?: number | null;
    RowIndex: number;
    ColIndex: number;
    IsAisle: boolean;
}

class SeatLayoutModel {
    static async getHallById(hallId: number) {
        const pool = await connectDB();

        const result = await pool.request()
            .input('hallId', mssql.Int, hallId)
            .query(`
        SELECT HallID, CinemaID, HallName, TotalRows, TotalCols, TotalSeats
        FROM CinemaHall
        WHERE HallID = @hallId
      `);

        return result.recordset[0] || null;
    }

    static async getSeatsByHallId(hallId: number) {
        const pool = await connectDB();

        const result = await pool.request()
            .input('hallId', mssql.Int, hallId)
            .query(`
        SELECT
          SeatID,
          HallID,
          SeatNumber,
          SeatType,
          SeatPrice,
          PairID,
          RowIndex,
          ColIndex,
          IsAisle
        FROM CinemaHallSeat
        WHERE HallID = @hallId
        ORDER BY RowIndex, ColIndex
      `);

        return result.recordset;
    }

    static async hasSeatBookings(hallId: number) {
        const pool = await connectDB();

        const result = await pool.request()
            .input('hallId', mssql.Int, hallId)
            .query(`
        SELECT COUNT(1) AS Total
        FROM BookingSeat bs
        INNER JOIN CinemaHallSeat chs ON bs.SeatID = chs.SeatID
        WHERE chs.HallID = @hallId
      `);

        return Number(result.recordset[0]?.Total || 0) > 0;
    }

    static async replaceHallSeats(
        hallId: number,
        payload: {
            totalRows: number;
            totalCols: number;
            seats: SeatLayoutItem[];
        }
    ) {
        const pool = await connectDB();
        const transaction = new mssql.Transaction(pool);

        await transaction.begin();

        try {
            const seats = payload.seats || [];
            const totalRows = Number(payload.totalRows) || 0;
            const totalCols = Number(payload.totalCols) || 0;
            const totalSeats = seats.filter((seat) => {
                const isAisle = Boolean(seat.IsAisle) || seat.SeatType === 'AISLE';
                return !isAisle && seat.SeatType !== 'DISABLED';
            }).length;

            await new mssql.Request(transaction)
                .input('hallId', mssql.Int, hallId)
                .input('totalRows', mssql.Int, totalRows)
                .input('totalCols', mssql.Int, totalCols)
                .input('totalSeats', mssql.Int, totalSeats)
                .query(`
          UPDATE CinemaHall
          SET TotalRows = @totalRows,
              TotalCols = @totalCols,
              TotalSeats = @totalSeats
          WHERE HallID = @hallId
        `);

            await new mssql.Request(transaction)
                .input('hallId', mssql.Int, hallId)
                .query(`
          DELETE FROM CinemaHallSeat
          WHERE HallID = @hallId
        `);

            for (const seat of seats) {
                const isAisle = Boolean(seat.IsAisle) || seat.SeatType === 'AISLE';
                const seatType = isAisle ? 'AISLE' : seat.SeatType;
                const seatNumber = isAisle ? null : String(seat.SeatNumber || '').trim();
                const seatPrice = isAisle || seatType === 'DISABLED' ? 0 : Number(seat.SeatPrice) || 0;
                const pairId = seatType === 'COUPLE' ? seat.PairID || null : null;

                await new mssql.Request(transaction)
                    .input('hallId', mssql.Int, hallId)
                    .input('seatNumber', mssql.NVarChar(20), seatNumber)
                    .input('seatType', mssql.NVarChar(20), seatType || 'STANDARD')
                    .input('seatPrice', mssql.Decimal(10, 2), seatPrice)
                    .input('pairId', mssql.Int, pairId)
                    .input('rowIndex', mssql.Int, seat.RowIndex)
                    .input('colIndex', mssql.Int, seat.ColIndex)
                    .input('isAisle', mssql.Bit, isAisle ? 1 : 0)
                    .query(`
            INSERT INTO CinemaHallSeat (
              HallID,
              SeatNumber,
              SeatType,
              SeatPrice,
              PairID,
              RowIndex,
              ColIndex,
              IsAisle
            )
            VALUES (
              @hallId,
              @seatNumber,
              @seatType,
              @seatPrice,
              @pairId,
              @rowIndex,
              @colIndex,
              @isAisle
            )
          `);
            }

            await transaction.commit();

            return {
                HallID: hallId,
                TotalRows: totalRows,
                TotalCols: totalCols,
                TotalSeats: totalSeats,
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export default SeatLayoutModel;
