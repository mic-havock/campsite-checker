import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('CampsiteAvailability Logic', () => {
  test('gridColumnStart calculation for May 2025 (Starts on Thursday)', () => {
    const year = 2025;
    const month = 4; // May (0-indexed)
    const firstDay = new Date(year, month, 1);

    // 0 is Sunday, 1 is Monday, ..., 4 is Thursday
    assert.strictEqual(firstDay.getDay(), 4);

    const firstDayColumn = firstDay.getDay() + 1;
    assert.strictEqual(firstDayColumn, 5);
  });

  test('gridColumnStart calculation for June 2025 (Starts on Sunday)', () => {
    const year = 2025;
    const month = 5; // June (0-indexed)
    const firstDay = new Date(year, month, 1);

    // 0 is Sunday
    assert.strictEqual(firstDay.getDay(), 0);

    const firstDayColumn = firstDay.getDay() + 1;
    assert.strictEqual(firstDayColumn, 1);
  });

  test('gridColumnStart calculation for January 2024 (Starts on Monday)', () => {
    const year = 2024;
    const month = 0; // January (0-indexed)
    const firstDay = new Date(year, month, 1);

    // 1 is Monday
    assert.strictEqual(firstDay.getDay(), 1);

    const firstDayColumn = firstDay.getDay() + 1;
    assert.strictEqual(firstDayColumn, 2);
  });
});
