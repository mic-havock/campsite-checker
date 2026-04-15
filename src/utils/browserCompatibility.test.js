import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import * as browserCompat from './browserCompatibility.js';
import { isMobileDevice } from "./browserCompatibility.js";

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

  describe("isMobileDevice", () => {
    const setMockUserAgent = (userAgent) => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent },
        writable: true,
        configurable: true
      });
    };

    test("should return true for Android devices", () => {
      setMockUserAgent("Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for iPhone", () => {
      setMockUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for iPad", () => {
      setMockUserAgent("Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for iPod", () => {
      setMockUserAgent("Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for BlackBerry", () => {
      setMockUserAgent("Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for IEMobile", () => {
      setMockUserAgent("Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for Opera Mini", () => {
      setMockUserAgent("Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; id) Presto/2.12.423 Version/12.16");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return true for webOS", () => {
      setMockUserAgent("Mozilla/5.0 (webOS/1.4.1.1; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pre/1.0");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should be case-insensitive (lowercase user agent)", () => {
      setMockUserAgent("mozilla/5.0 (iphone; cpu iphone os 13_2_3 like mac os x)");
      assert.strictEqual(isMobileDevice(), true);
    });

    test("should return false for desktop Windows", () => {
      setMockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36");
      assert.strictEqual(isMobileDevice(), false);
    });

    test("should return false for desktop Mac", () => {
      setMockUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36");
      assert.strictEqual(isMobileDevice(), false);
    });

    test("should return false for desktop Linux", () => {
      setMockUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36");
      assert.strictEqual(isMobileDevice(), false);
    });

    test("should return false for empty user agent", () => {
      setMockUserAgent("");
      assert.strictEqual(isMobileDevice(), false);
    });

    test("should return false for undefined user agent", () => {
      setMockUserAgent(undefined);
      assert.strictEqual(isMobileDevice(), false);
    });

    test("should return false if navigator is not defined", () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true
      });
      assert.throws(() => isMobileDevice(), TypeError);
    });
  });
});
