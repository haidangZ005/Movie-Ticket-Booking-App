import sql from 'mssql';
import redisClient from '../config/redis';
import { getPool } from '../config/database';
import { broadcastSeatUpdate } from '../socket';

const HOLD_TTL_SECONDS = 10 * 60;

const getHoldKey = (showId: number, seatId: number) => `seat:hold:${showId}:${seatId}`;

const ensureRedisConnected = async () => {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'connect') {
    return;
  }

  await redisClient.connect();
};

export const holdSeats = async (showId: number, seatIds: number[], customerId: number) => {
  const uniqueSeatIds = Array.from(new Set(seatIds.filter(Number.isFinite)));

  if (!showId || uniqueSeatIds.length === 0) {
    return { success: false, message: 'Dữ liệu giữ ghế không hợp lệ.' };
  }

  const pool = getPool();
  const request = pool.request()
    .input('ShowID', sql.Int, showId);

  uniqueSeatIds.forEach((seatId, index) => {
    request.input(`SeatID${index}`, sql.Int, seatId);
  });

  const seatIdParams = uniqueSeatIds.map((_, index) => `@SeatID${index}`).join(', ');
  const seatResult = await request.query(`
    SELECT
      cs.SeatID,
      cs.SeatNumber,
      cs.SeatType,
      cs.IsAisle
    FROM [Show] sh
    INNER JOIN CinemaHallSeat cs ON cs.HallID = sh.HallID
    WHERE sh.ShowID = @ShowID
      AND cs.SeatID IN (${seatIdParams})
  `);

  if (seatResult.recordset.length !== uniqueSeatIds.length) {
    return { success: false, message: 'Một số ghế không thuộc suất chiếu này.' };
  }

  const invalidSeat = seatResult.recordset.find((seat) => (
    seat.IsAisle ||
    seat.SeatType === 'AISLE' ||
    seat.SeatType === 'EMPTY' ||
    seat.SeatType === 'DISABLED'
  ));

  if (invalidSeat) {
    return {
      success: false,
      seatId: invalidSeat.SeatID,
      message: 'Ghế không khả dụng để đặt.',
    };
  }

  const bookedResult = await pool.request()
    .input('ShowID', sql.Int, showId)
    .query(`
      SELECT SeatID
      FROM BookingSeat
      WHERE ShowID = @ShowID
        AND Status = 'BOOKED'
    `);

  const bookedSeatIds = new Set(bookedResult.recordset.map((row) => Number(row.SeatID)));
  const bookedConflict = uniqueSeatIds.find((seatId) => bookedSeatIds.has(seatId));

  if (bookedConflict) {
    return {
      success: false,
      seatId: bookedConflict,
      message: 'Ghế đã được đặt.',
    };
  }

  await ensureRedisConnected();

  const holdUntil = new Date(Date.now() + HOLD_TTL_SECONDS * 1000);
  const lockedSeatIds: number[] = [];

  for (const seatId of uniqueSeatIds) {
    const key = getHoldKey(showId, seatId);
    const result = await redisClient.set(key, String(customerId), 'EX', HOLD_TTL_SECONDS, 'NX');

    if (result !== 'OK') {
      for (const lockedSeatId of lockedSeatIds) {
        await redisClient.del(getHoldKey(showId, lockedSeatId));
      }

      return {
        success: false,
        seatId,
        message: 'Ghế đang được người khác giữ.',
      };
    }

    lockedSeatIds.push(seatId);
  }

  const seatsById = new Map(seatResult.recordset.map((seat) => [Number(seat.SeatID), seat]));
  lockedSeatIds.forEach((seatId) => {
    const seat = seatsById.get(seatId);
    broadcastSeatUpdate(showId, seatId, seat?.SeatNumber || '', 'HOLDING', customerId, holdUntil);
  });

  return {
    success: true,
    showId,
    seatIds: lockedSeatIds,
    holdBy: customerId,
    holdUntil,
  };
};

export const releaseSeats = async (showId: number, seatIds: number[], customerId: number) => {
  const uniqueSeatIds = Array.from(new Set(seatIds.filter(Number.isFinite)));

  if (!showId || uniqueSeatIds.length === 0) {
    return { success: true, showId, seatIds: [] };
  }

  await ensureRedisConnected();

  const releasedSeatIds: number[] = [];
  for (const seatId of uniqueSeatIds) {
    const key = getHoldKey(showId, seatId);
    const holder = await redisClient.get(key);

    if (holder && Number(holder) === Number(customerId)) {
      await redisClient.del(key);
      releasedSeatIds.push(seatId);
    }
  }

  const pool = getPool();
  const request = pool.request();
  releasedSeatIds.forEach((seatId, index) => {
    request.input(`SeatID${index}`, sql.Int, seatId);
  });

  const seatNumbers = new Map<number, string>();
  if (releasedSeatIds.length > 0) {
    const seatIdParams = releasedSeatIds.map((_, index) => `@SeatID${index}`).join(', ');
    const seatResult = await request.query(`
      SELECT SeatID, SeatNumber
      FROM CinemaHallSeat
      WHERE SeatID IN (${seatIdParams})
    `);
    seatResult.recordset.forEach((seat) => {
      seatNumbers.set(Number(seat.SeatID), seat.SeatNumber || '');
    });
  }

  releasedSeatIds.forEach((seatId) => {
    broadcastSeatUpdate(showId, seatId, seatNumbers.get(seatId) || '', 'AVAILABLE', null, null);
  });

  return {
    success: true,
    showId,
    seatIds: releasedSeatIds,
  };
};

export default {
  holdSeats,
  releaseSeats,
};
