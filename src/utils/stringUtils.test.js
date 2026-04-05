import { test } from "node:test";
import assert from "node:assert";
import { toTitleCase } from "./stringUtils.js";

test("toTitleCase - empty string", () => {
  assert.strictEqual(toTitleCase(""), "");
});

test("toTitleCase - null", () => {
  assert.strictEqual(toTitleCase(null), "");
});

test("toTitleCase - undefined", () => {
  assert.strictEqual(toTitleCase(undefined), "");
});

test("toTitleCase - basic string", () => {
  assert.strictEqual(toTitleCase("hello world"), "Hello World");
});

test("toTitleCase - uppercase string", () => {
  assert.strictEqual(toTitleCase("HELLO WORLD"), "Hello World");
});

test("toTitleCase - preserves exception words: AM", () => {
  assert.strictEqual(toTitleCase("10 AM"), "10 AM");
});

test("toTitleCase - preserves exception words: PM", () => {
  assert.strictEqual(toTitleCase("2 PM"), "2 PM");
});

test("toTitleCase - preserves exception words: RV", () => {
  assert.strictEqual(toTitleCase("RV site"), "RV Site");
});

test("toTitleCase - handles slash-separated words", () => {
  assert.strictEqual(toTitleCase("tent/rv"), "Tent/Rv");
});

test("toTitleCase - handles multiple spaces", () => {
  assert.strictEqual(toTitleCase("multiple   spaces"), "Multiple   Spaces");

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
