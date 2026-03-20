import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toTitleCase } from './stringUtils.js';

describe('toTitleCase', () => {
  test('returns empty string for falsy values', () => {
    assert.equal(toTitleCase(''), '');
    assert.equal(toTitleCase(null), '');
    assert.equal(toTitleCase(undefined), '');
  });

  test('capitalizes normal words', () => {
    assert.equal(toTitleCase('hello world'), 'Hello World');
    assert.equal(toTitleCase('HELLO WORLD'), 'Hello World');
    assert.equal(toTitleCase('hElLo wOrLd'), 'Hello World');
  });

  test('preserves uppercase for exceptions', () => {
    assert.equal(toTitleCase('hello AM'), 'Hello AM');
    assert.equal(toTitleCase('PM test'), 'PM Test');
    assert.equal(toTitleCase('RV parking'), 'RV Parking');
  });

  test('handles slashes correctly', () => {
    assert.equal(toTitleCase('water/electric'), 'Water/Electric');
    assert.equal(toTitleCase('WATER/ELECTRIC'), 'Water/Electric');
  });

  test('handles consecutive spaces', () => {
    // Note: implementation uses split(' ') which reduces multiple spaces to single spaces or includes empty strings.
    // 'hello  world'.split(' ') -> ['hello', '', 'world']
    // capitalize of '' is '' -> '' + '' -> ''
    // join(' ') -> 'Hello  World'
    assert.equal(toTitleCase('hello  world'), 'Hello  World');
  });
});
