import { Response } from 'express';
import sql from 'mssql';
import { getPool } from '../../config/database';
import redisClient from '../../config/redis';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import PricingService from '../../services/pricing.service';

export const createBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = Number(req.user?.customerId);
  const showId = Number(req.body.showId);
  const seatIds = Array.isArray(req.body.seatIds) ? req.body.seatIds.map(Number).filter(Boolean) : [];
  const totalAmount = Number(req.body.totalAmount);
  const products = Array.isArray(req.body.products) ? req.body.products : [];

  if (!customerId || !showId || seatIds.length === 0 || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new AppException(ErrorCode.INVALID_DATA);
  }

  for (const seatId of seatIds) {
    const holder = await redisClient.get(`seat:hold:${showId}:${seatId}`);
    if (holder && Number(holder) !== customerId) {
      throw new AppException(ErrorCode.SEAT_ALREADY_HELD);
    }
  }

  const pricing = await PricingService.calculateBatchPrice(showId, seatIds);
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  let transactionActive = false;

  try {
    await transaction.begin();
    transactionActive = true;

    const bookedCheck = await new sql.Request(transaction)
      .input('ShowID', sql.Int, showId)
      .query(`
        SELECT SeatID
        FROM BookingSeat
        WHERE ShowID = @ShowID
          AND Status = 'BOOKED'
          AND SeatID IN (${seatIds.join(',')})
      `);

    if (bookedCheck.recordset.length > 0) {
      throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
    }

    const bookingResult = await new sql.Request(transaction)
      .input('CustomerID', sql.Int, customerId)
      .input('ShowID', sql.Int, showId)
      .input('TotalSeats', sql.Int, seatIds.length)
      .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
      .query(`
        INSERT INTO Booking (CustomerID, ShowID, TotalSeats, TotalAmount, Status, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.BookingID, INSERTED.CustomerID, INSERTED.ShowID, INSERTED.TotalSeats, INSERTED.TotalAmount, INSERTED.Status
        VALUES (@CustomerID, @ShowID, @TotalSeats, @TotalAmount, 'PENDING_PAYMENT', GETDATE(), GETDATE())
      `);

    const booking = bookingResult.recordset[0];

    for (let index = 0; index < seatIds.length; index += 1) {
      await new sql.Request(transaction)
        .input('BookingID', sql.Int, booking.BookingID)
        .input('ShowID', sql.Int, showId)
        .input('SeatID', sql.Int, seatIds[index])
        .input('TicketPrice', sql.Decimal(10, 2), pricing.seats[index]?.totalPrice ?? 0)
        .query(`
          INSERT INTO BookingSeat (BookingID, ShowID, SeatID, Status, TicketPrice, HoldUntil)
          VALUES (@BookingID, @ShowID, @SeatID, 'HOLDING', @TicketPrice, DATEADD(minute, 10, GETDATE()))
        `);
    }

    for (const product of products) {
      const productId = Number(product.productId ?? product.ProductID);
      const quantity = Number(product.quantity ?? product.Quantity);
      const unitPrice = Number(product.price ?? product.UnitPrice ?? product.Price);

      if (!productId || !quantity || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        continue;
      }

      await new sql.Request(transaction)
        .input('BookingID', sql.Int, booking.BookingID)
        .input('ProductID', sql.Int, productId)
        .input('Quantity', sql.Int, quantity)
        .input('UnitPrice', sql.Decimal(10, 2), unitPrice)
        .query(`
          INSERT INTO BookingProduct (BookingID, ProductID, Quantity, UnitPrice)
          VALUES (@BookingID, @ProductID, @Quantity, @UnitPrice)
        `);
    }

    await transaction.commit();
    transactionActive = false;

    return res.status(201).json(ApiResponse.success(ResponseCode.SUCCESS, {
      bookingId: booking.BookingID,
      booking,
    }));
  } catch (error) {
    if (transactionActive) {
      await transaction.rollback();
    }
    throw error;
  }
});
