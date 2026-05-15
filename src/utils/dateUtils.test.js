import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getUtcDateStringsForMonth } from './dateUtils.js';

describe('dateUtils', () => {
  describe('getUtcDateStringsForMonth', () => {
    it('should return correct number of days for February 2024 (leap year)', () => {
      const dates = getUtcDateStringsForMonth('2024-02-01T00:00:00Z');
      assert.strictEqual(dates.length, 29);
      assert.strictEqual(dates[0], '2024-02-01');
      assert.strictEqual(dates[28], '2024-02-29');
    });

    it('should return correct number of days for January 2024', () => {
      const dates = getUtcDateStringsForMonth('2024-01-15T12:00:00Z');
      assert.strictEqual(dates.length, 31);
      assert.strictEqual(dates[0], '2024-01-01');
      assert.strictEqual(dates[30], '2024-01-31');
    });

    it('should return correct number of days for April 2024', () => {
      const dates = getUtcDateStringsForMonth('2024-04-01T00:00:00Z');
      assert.strictEqual(dates.length, 30);
      assert.strictEqual(dates[0], '2024-04-01');
      assert.strictEqual(dates[29], '2024-04-30');
    });
  });
});
