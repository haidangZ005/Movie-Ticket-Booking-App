import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import SeatLayoutModel from '../../src/models/seat-layout.model';
import SeatLayoutService from '../../src/services/seat-layout.service';

const originals = {
  getHallById: SeatLayoutModel.getHallById,
  hasSeatBookings: SeatLayoutModel.hasSeatBookings,
  replaceHallSeats: SeatLayoutModel.replaceHallSeats,
};

let replacedPayload: any;
let replaceCalled: boolean;

function bookableSeat(overrides: Record<string, unknown> = {}) {
  return {
    SeatNumber: 'A1',
    SeatType: 'STANDARD',
    SeatPrice: 75000,
    PairID: null,
    RowIndex: 1,
    ColIndex: 1,
    IsAisle: false,
    ...overrides,
  };
}

beforeEach(() => {
  replacedPayload = undefined;
  replaceCalled = false;

  (SeatLayoutModel as any).getHallById = async () => ({
    HallID: 1,
    HallName: 'Cinema 1',
    TotalRows: 5,
    TotalCols: 8,
  });
  (SeatLayoutModel as any).hasSeatBookings = async () => false;
  (SeatLayoutModel as any).replaceHallSeats = async (_hallId: number, payload: any) => {
    replaceCalled = true;
    replacedPayload = payload;
    return {
      HallID: 1,
      TotalRows: payload.totalRows,
      TotalCols: payload.totalCols,
      TotalSeats: payload.seats.filter((seat: any) => !seat.IsAisle && !['DISABLED', 'EMPTY'].includes(seat.SeatType)).length,
    };
  };
});

afterEach(() => {
  (SeatLayoutModel as any).getHallById = originals.getHallById;
  (SeatLayoutModel as any).hasSeatBookings = originals.hasSeatBookings;
  (SeatLayoutModel as any).replaceHallSeats = originals.replaceHallSeats;
});

describe('SeatLayoutService.replaceByHallId', () => {
  test('normalizes non-bookable seats before replacing the layout', async () => {
    await SeatLayoutService.replaceByHallId(1, {
      totalRows: 1,
      totalCols: 2,
      seats: [
        bookableSeat({
          SeatNumber: ' A1 ',
          SeatType: 'STANDARD',
          RowIndex: 1,
          ColIndex: 1,
        }) as any,
        bookableSeat({
          SeatNumber: 'X9',
          SeatType: 'AISLE',
          SeatPrice: 99999,
          PairID: null,
          RowIndex: 1,
          ColIndex: 2,
          IsAisle: false,
        }) as any,
      ],
    });

    assert.equal(replaceCalled, true);
    assert.equal(replacedPayload.seats[0].SeatNumber, 'A1');
    assert.deepEqual(replacedPayload.seats[1], {
      SeatNumber: '',
      SeatType: 'AISLE',
      SeatPrice: 0,
      PairID: null,
      RowIndex: 1,
      ColIndex: 2,
      IsAisle: true,
    });
  });

  test('rejects duplicate seat positions', async () => {
    await assert.rejects(
      () => SeatLayoutService.replaceByHallId(1, {
        totalRows: 1,
        totalCols: 2,
        seats: [
          bookableSeat({ SeatNumber: 'A1', RowIndex: 1, ColIndex: 1 }) as any,
          bookableSeat({ SeatNumber: 'A2', RowIndex: 1, ColIndex: 1 }) as any,
        ],
      }),
      (error: any) => error.errorCode === 'DUPLICATED_SEAT_POSITION'
    );
    assert.equal(replaceCalled, false);
  });

  test('rejects PairID on non-couple seats', async () => {
    await assert.rejects(
      () => SeatLayoutService.replaceByHallId(1, {
        totalRows: 1,
        totalCols: 1,
        seats: [
          bookableSeat({
            SeatType: 'VIP',
            PairID: 2,
          }) as any,
        ],
      }),
      (error: any) => error.errorCode === 'INVALID_PAIR_ID'
    );
    assert.equal(replaceCalled, false);
  });

  test('does not replace layout when the hall already has bookings', async () => {
    (SeatLayoutModel as any).hasSeatBookings = async () => true;

    await assert.rejects(
      () => SeatLayoutService.replaceByHallId(1, {
        totalRows: 1,
        totalCols: 1,
        seats: [bookableSeat() as any],
      }),
      (error: any) => error.errorCode === 'SEAT_LAYOUT_HAS_BOOKINGS'
    );
    assert.equal(replaceCalled, false);
  });
});
