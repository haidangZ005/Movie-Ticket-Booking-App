import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { VoucherService } from '../../src/services/voucher.service';

function makeVoucher(overrides: Record<string, unknown> = {}) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    VoucherID: 1,
    Code: 'WELCOME30',
    DiscountType: 'PERCENT',
    DiscountValue: 30,
    MaxDiscount: 50000,
    MinOrderValue: 0,
    MinTicketQty: 0,
    ApplicableFormat: 'ALL',
    StartDate: yesterday,
    EndDate: tomorrow,
    UsageLimit: 100,
    UsageCount: 0,
    IsActive: true,
    ...overrides,
  };
}

describe('VoucherService.calculateDiscount', () => {
  test('caps percentage discount by MaxDiscount', () => {
    const voucher = makeVoucher({
      DiscountType: 'PERCENT',
      DiscountValue: 50,
      MaxDiscount: 40000,
    });

    assert.equal(VoucherService.calculateDiscount(voucher, 100000), 40000);
  });

  test('does not discount more than the order total for fixed vouchers', () => {
    const voucher = makeVoucher({
      DiscountType: 'FIXED',
      DiscountValue: 200000,
    });

    assert.equal(VoucherService.calculateDiscount(voucher, 75000), 75000);
  });
});

describe('VoucherService.evaluateVoucher', () => {
  test('marks a matching voucher as applicable', () => {
    const result = VoucherService.evaluateVoucher(makeVoucher(), 150000, 2, '2D', false);

    assert.deepEqual(result, { applicable: true });
  });

  test('rejects voucher when the order total is below minimum value', () => {
    const result = VoucherService.evaluateVoucher(
      makeVoucher({ MinOrderValue: 200000 }),
      150000,
      2,
      '2D',
      false
    );

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'MIN_ORDER_NOT_MET');
  });

  test('rejects voucher when the ticket quantity is below minimum quantity', () => {
    const result = VoucherService.evaluateVoucher(
      makeVoucher({ MinTicketQty: 3 }),
      300000,
      2,
      '2D',
      false
    );

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'MIN_TICKET_NOT_MET');
  });

  test('rejects voucher when the show format does not match', () => {
    const result = VoucherService.evaluateVoucher(
      makeVoucher({ ApplicableFormat: 'IMAX' }),
      300000,
      2,
      '2D',
      false
    );

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'FORMAT_NOT_MATCH');
  });

  test('rejects voucher when the customer already used it', () => {
    const result = VoucherService.evaluateVoucher(makeVoucher(), 300000, 2, '2D', true);

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'ALREADY_USED');
  });

  test('rejects expired voucher at end of day boundary', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = VoucherService.evaluateVoucher(
      makeVoucher({ StartDate: twoDaysAgo, EndDate: yesterday }),
      300000,
      2,
      '2D',
      false
    );

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'EXPIRED');
  });

  test('rejects voucher that has not started yet', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const result = VoucherService.evaluateVoucher(
      makeVoucher({ StartDate: tomorrow, EndDate: nextWeek }),
      300000,
      2,
      '2D',
      false
    );

    assert.equal(result.applicable, false);
    assert.equal(result.reasonCode, 'NOT_STARTED');
  });
});
