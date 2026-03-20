/* global global */
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import * as browserCompat from './browserCompatibility.js';

describe('browserCompatibility', () => {
  let originalNavigator;
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    originalWindow = global.window;
    originalDocument = global.document;
    originalNavigator = global.navigator;

    global.window = {
      innerHeight: 1000,
      innerWidth: 800,
      scrollY: 0,
      scrollTo: mock.fn(),
      addEventListener: mock.fn(),
    };

    global.document = {
      documentElement: {
        style: {
          setProperty: mock.fn(),
        }
      },
      body: {
        classList: {
          add: mock.fn(),
          remove: mock.fn(),
        },
        style: {}
      }
    };

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32',
        maxTouchPoints: 0,
        msMaxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;

    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  test('setViewportHeight', () => {
    browserCompat.setViewportHeight();
    assert.strictEqual(global.document.documentElement.style.setProperty.mock.calls.length, 1);
    assert.deepStrictEqual(global.document.documentElement.style.setProperty.mock.calls[0].arguments, ['--vh', '10px']);
  });

  test('isTouchDevice', () => {
    assert.strictEqual(browserCompat.isTouchDevice(), false);

    global.window.ontouchstart = null;
    assert.strictEqual(browserCompat.isTouchDevice(), true);
    delete global.window.ontouchstart;

    global.navigator.maxTouchPoints = 1;
    assert.strictEqual(browserCompat.isTouchDevice(), true);
    global.navigator.maxTouchPoints = 0;

    global.navigator.msMaxTouchPoints = 1;
    assert.strictEqual(browserCompat.isTouchDevice(), true);
    global.navigator.msMaxTouchPoints = 0;
  });
});
