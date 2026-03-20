import test from 'node:test';
import assert from 'node:assert';
import { RESERVATION_STATUS, isNonReservableStatus } from './reservationStatus.js';

test('isNonReservableStatus', async (t) => {
  await t.test('should return true for null, undefined, or empty string', () => {
    assert.strictEqual(isNonReservableStatus(null), true);
    assert.strictEqual(isNonReservableStatus(undefined), true);
    assert.strictEqual(isNonReservableStatus(''), true);
  });

  await t.test('should return true for non-reservable statuses', () => {
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.NOT_RESERVABLE), true);
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.NOT_AVAILABLE), true);
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.CLOSED), true);
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF), true);
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.NOT_YET_RESERVABLE), true);
  });

  await t.test('should return false for reservable statuses', () => {
    assert.strictEqual(isNonReservableStatus('Available'), false);
    assert.strictEqual(isNonReservableStatus('Reserved'), false);
    assert.strictEqual(isNonReservableStatus('Some Other Status'), false);
  });
});

test('RESERVATION_STATUS constants', async (t) => {
  await t.test('should have expected non-reservable constants', () => {
    assert.strictEqual(RESERVATION_STATUS.NOT_RESERVABLE, 'Not Reservable');
    assert.strictEqual(RESERVATION_STATUS.NOT_AVAILABLE, 'Not Available');
    assert.strictEqual(RESERVATION_STATUS.CLOSED, 'Closed');
    assert.strictEqual(RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF, 'Not Available Cutoff');
    assert.strictEqual(RESERVATION_STATUS.NOT_YET_RESERVABLE, 'NYR');
  });
});
