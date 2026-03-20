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
});
