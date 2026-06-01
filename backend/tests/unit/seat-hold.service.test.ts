import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../../src/config/database';
import redisClient from '../../src/config/redis';
import * as socket from '../../src/socket';
import * as SeatHoldService from '../../src/services/seat-hold.service';

type QueryCall = {
  inputs: Record<string, unknown>;
  sqlText: string;
};

const originals = {
  getPool: database.getPool,
  redisStatus: redisClient.status,
  redisConnect: redisClient.connect,
  redisSet: redisClient.set,
  redisGet: redisClient.get,
  redisDel: redisClient.del,
  broadcastSeatUpdate: socket.broadcastSeatUpdate,
};

let seatRows: any[];
let bookedRows: any[];
let releaseSeatRows: any[];
let redisValues: Map<string, string>;
let setResults: Array<'OK' | null>;
let setCalls: any[];
let delCalls: string[];
let broadcasts: any[];
let queries: QueryCall[];

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

          if (sqlText.includes('FROM [Show]')) {
            return { recordset: seatRows };
          }

          if (sqlText.includes('FROM BookingSeat')) {
            return { recordset: bookedRows };
          }

          if (sqlText.includes('FROM CinemaHallSeat')) {
            return { recordset: releaseSeatRows };
          }

          return { recordset: [] };
        },
      };
    },
  };
}

beforeEach(() => {
  seatRows = [];
  bookedRows = [];
  releaseSeatRows = [];
  redisValues = new Map();
  setResults = [];
  setCalls = [];
  delCalls = [];
  broadcasts = [];
  queries = [];

  (database as any).getPool = mockPool;
  Object.defineProperty(redisClient, 'status', {
    configurable: true,
    value: 'ready',
  });
  (redisClient as any).connect = async () => undefined;
  (redisClient as any).set = async (...args: any[]) => {
    setCalls.push(args);
    const key = args[0];
    const value = args[1];
    const result = setResults.length > 0 ? setResults.shift() : 'OK';
    if (result === 'OK') {
      redisValues.set(key, value);
    }
    return result;
  };
  (redisClient as any).get = async (key: string) => redisValues.get(key) ?? null;
  (redisClient as any).del = async (key: string) => {
    delCalls.push(key);
    redisValues.delete(key);
    return 1;
  };
  (socket as any).broadcastSeatUpdate = (...args: any[]) => {
    broadcasts.push(args);
  };
});

afterEach(() => {
  (database as any).getPool = originals.getPool;
  Object.defineProperty(redisClient, 'status', {
    configurable: true,
    value: originals.redisStatus,
  });
  (redisClient as any).connect = originals.redisConnect;
  (redisClient as any).set = originals.redisSet;
  (redisClient as any).get = originals.redisGet;
  (redisClient as any).del = originals.redisDel;
  (socket as any).broadcastSeatUpdate = originals.broadcastSeatUpdate;
});

describe('SeatHoldService.holdSeats', () => {
  test('deduplicates selected seats before creating Redis holds', async () => {
    seatRows = [
      {
        SeatID: 1,
        SeatNumber: 'A1',
        SeatType: 'STANDARD',
        IsAisle: false,
      },
    ];

    const result = await SeatHoldService.holdSeats(20, [1, 1, Number.NaN], 7);

    assert.equal(result.success, true);
    assert.deepEqual((result as any).seatIds, [1]);
    assert.equal(setCalls.length, 1);
    assert.equal(setCalls[0][0], 'seat:hold:20:1');
    assert.equal(broadcasts.length, 1);
    assert.deepEqual(broadcasts[0].slice(0, 5), [20, 1, 'A1', 'HOLDING', 7]);
  });

  test('rejects seats that are not bookable', async () => {
    seatRows = [
      {
        SeatID: 2,
        SeatNumber: '',
        SeatType: 'EMPTY',
        IsAisle: false,
      },
    ];

    const result = await SeatHoldService.holdSeats(20, [2], 7);

    assert.equal(result.success, false);
    assert.equal((result as any).seatId, 2);
    assert.equal(setCalls.length, 0);
    assert.equal(broadcasts.length, 0);
  });

  test('rolls back Redis holds when one requested seat is already held', async () => {
    seatRows = [
      { SeatID: 1, SeatNumber: 'A1', SeatType: 'STANDARD', IsAisle: false },
      { SeatID: 2, SeatNumber: 'A2', SeatType: 'STANDARD', IsAisle: false },
    ];
    setResults = ['OK', null];

    const result = await SeatHoldService.holdSeats(20, [1, 2], 7);

    assert.equal(result.success, false);
    assert.equal((result as any).seatId, 2);
    assert.deepEqual(delCalls, ['seat:hold:20:1']);
    assert.equal(broadcasts.length, 0);
  });
});

describe('SeatHoldService.releaseSeats', () => {
  test('only releases seats held by the same customer', async () => {
    redisValues.set('seat:hold:20:1', '7');
    redisValues.set('seat:hold:20:2', '8');
    releaseSeatRows = [
      {
        SeatID: 1,
        SeatNumber: 'A1',
      },
    ];

    const result = await SeatHoldService.releaseSeats(20, [1, 2], 7);

    assert.equal(result.success, true);
    assert.deepEqual(result.seatIds, [1]);
    assert.deepEqual(delCalls, ['seat:hold:20:1']);
    assert.equal(redisValues.has('seat:hold:20:2'), true);
    assert.deepEqual(broadcasts[0], [20, 1, 'A1', 'AVAILABLE', null, null]);
  });
});
