import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../../src/config/database';
import { PaymentModel } from '../../src/models/payment.model';
import { PaymentService } from '../../src/services/payment.service';
import { VoucherService } from '../../src/services/voucher.service';

type QueryCall = {
  inputs: Record<string, unknown>;
  sqlText: string;
};

type StatusUpdate = {
  bookingId: number;
  status: string;
  extra?: unknown;
};

const originals = {
  getPool: database.getPool,
  createPayment: PaymentModel.create,
  updatePaymentStatus: PaymentModel.updateStatus,
  getBookingPaymentContext: (PaymentService as any).getBookingPaymentContext,
  applyAndCalculate: VoucherService.applyAndCalculate,
};

let queries: QueryCall[];
let createdPayments: unknown[];
let statusUpdates: StatusUpdate[];

function mockPool() {
  return {
    request() {
      const inputs: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) {
          inputs[name] = value;
          return this;
        },
        async query(sqlText: string) {
          queries.push({ inputs, sqlText });
          return { recordset: [] };
        },
      };
    },
  };
}

beforeEach(() => {
  queries = [];
  createdPayments = [];
  statusUpdates = [];

  (database as any).getPool = mockPool;
  (PaymentModel as any).create = async (payload: any) => {
    createdPayments.push(payload);
    return {
      PaymentID: 1,
      BookingID: payload.bookingId,
      VoucherID: payload.voucherId ?? null,
      Amount: payload.amount,
      DiscountAmount: payload.discountAmount ?? 0,
      PaymentMethod: payload.method ?? null,
      Status: 'CREATED',
    };
  };
  (PaymentModel as any).updateStatus = async (bookingId: number, status: string, extra?: unknown) => {
    statusUpdates.push({ bookingId, status, extra });
    return null;
  };
});

afterEach(() => {
  (database as any).getPool = originals.getPool;
  (PaymentModel as any).create = originals.createPayment;
  (PaymentModel as any).updateStatus = originals.updatePaymentStatus;
  (PaymentService as any).getBookingPaymentContext = originals.getBookingPaymentContext;
  (VoucherService as any).applyAndCalculate = originals.applyAndCalculate;
});

describe('PaymentService.initPayment', () => {
  test('uses backend booking total when creating a payment without voucher', async () => {
    (PaymentService as any).getBookingPaymentContext = async () => ({
      customerId: 7,
      totalSeats: 2,
      showFormat: '2D',
      originalAmount: 150000,
    });

    const result = await PaymentService.initPayment(10, 150000, 'CREDIT_CARD', 'VND', undefined, 0, 7);

    assert.equal(result.orderId, 10);
    assert.equal(createdPayments.length, 1);
    assert.deepEqual(createdPayments[0], {
      bookingId: 10,
      amount: 150000,
      method: 'CREDIT_CARD',
      voucherId: undefined,
      discountAmount: 0,
    });
    assert.equal(statusUpdates[0].status, 'PENDING_PAYMENT');
    assert.equal(queries[0].inputs.TotalAmount, 150000);
  });

  test('validates voucher against the server-side booking amount', async () => {
    (PaymentService as any).getBookingPaymentContext = async () => ({
      customerId: 7,
      totalSeats: 2,
      showFormat: 'IMAX',
      originalAmount: 200000,
    });

    let applyArgs: unknown[] | undefined;
    (VoucherService as any).applyAndCalculate = async (...args: unknown[]) => {
      applyArgs = args;
      return {
        voucherId: 3,
        voucherCode: 'IMAX30',
        discountType: 'FIXED',
        discountValue: 30000,
        discountAmount: 30000,
        finalAmount: 170000,
      };
    };

    await PaymentService.initPayment(10, 170000, 'CREDIT_CARD', 'VND', 3, 30000, 7);

    assert.deepEqual(applyArgs, [3, 7, undefined, 200000, 2, 'IMAX']);
    assert.equal((createdPayments[0] as any).amount, 170000);
    assert.equal((createdPayments[0] as any).discountAmount, 30000);
    assert.equal((createdPayments[0] as any).voucherId, 3);
    assert.equal(queries[0].inputs.TotalAmount, 170000);
  });

  test('rejects client amount tampering after voucher calculation', async () => {
    (PaymentService as any).getBookingPaymentContext = async () => ({
      customerId: 7,
      totalSeats: 2,
      showFormat: '2D',
      originalAmount: 200000,
    });
    (VoucherService as any).applyAndCalculate = async () => ({
      voucherId: 3,
      voucherCode: 'SALE30',
      discountType: 'FIXED',
      discountValue: 30000,
      discountAmount: 30000,
      finalAmount: 170000,
    });

    await assert.rejects(
      () => PaymentService.initPayment(10, 1000, 'CREDIT_CARD', 'VND', 3, 30000, 7),
      /INVALID_DATA|Dữ liệu không hợp lệ|Invalid data/i
    );
    assert.equal(createdPayments.length, 0);
    assert.equal(queries.length, 0);
  });

  test('rejects client discount tampering after voucher calculation', async () => {
    (PaymentService as any).getBookingPaymentContext = async () => ({
      customerId: 7,
      totalSeats: 2,
      showFormat: '2D',
      originalAmount: 200000,
    });
    (VoucherService as any).applyAndCalculate = async () => ({
      voucherId: 3,
      voucherCode: 'SALE30',
      discountType: 'FIXED',
      discountValue: 30000,
      discountAmount: 30000,
      finalAmount: 170000,
    });

    await assert.rejects(
      () => PaymentService.initPayment(10, 170000, 'CREDIT_CARD', 'VND', 3, 1, 7),
      /INVALID_DATA|Dữ liệu không hợp lệ|Invalid data/i
    );
    assert.equal(createdPayments.length, 0);
    assert.equal(queries.length, 0);
  });
});
