import assert from "node:assert";
import test from "node:test";
import { toTitleCase } from "./stringUtils.js";

test("toTitleCase", async (t) => {
  await t.test("capitalizes first letter of each word", () => {
    assert.strictEqual(toTitleCase("hello world"), "Hello World");
  });

  await t.test("handles mixed case input", () => {
    assert.strictEqual(toTitleCase("hElLo WoRlD"), "Hello World");
  });

  await t.test("handles single words", () => {
    assert.strictEqual(toTitleCase("test"), "Test");
    assert.strictEqual(toTitleCase("TEST"), "Test");
  });

  await t.test("handles acronyms", () => {
    assert.strictEqual(toTitleCase("usa"), "Usa");
    assert.strictEqual(toTitleCase("NASA"), "Nasa");
  });

  await t.test("handles empty string", () => {
    assert.strictEqual(toTitleCase(""), "");
  });

  await t.test("handles null or undefined", () => {
    assert.strictEqual(toTitleCase(null), "");
    assert.strictEqual(toTitleCase(undefined), "");
  });

  await t.test("preserves non-alphabetic characters", () => {
    assert.strictEqual(toTitleCase("123 test!"), "123 Test!");
    assert.strictEqual(toTitleCase("hello-world"), "Hello-World");
  });

  await t.test("handles multiple spaces between words", () => {
    assert.strictEqual(toTitleCase("hello   world"), "Hello   World");
  });
});
