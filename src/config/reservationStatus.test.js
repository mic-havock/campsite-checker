import test from "node:test";
import assert from "node:assert";
import {
  RESERVATION_STATUS,
  getAvailabilityCategory,
  isAlertableStatus,
  isAvailableForCheckIn,
  isCheckoutOnlyStatus,
  isNonReservableStatus,
} from "./reservationStatus.js";

test("isNonReservableStatus", async (t) => {
  await t.test("should return true for null, undefined, or empty string", () => {
    assert.strictEqual(isNonReservableStatus(null), true);
    assert.strictEqual(isNonReservableStatus(undefined), true);
    assert.strictEqual(isNonReservableStatus(""), true);
  });

  await t.test("should return true for non-reservable statuses", () => {
    assert.strictEqual(
      isNonReservableStatus(RESERVATION_STATUS.NOT_RESERVABLE),
      true,
    );
    assert.strictEqual(
      isNonReservableStatus(RESERVATION_STATUS.NOT_AVAILABLE),
      true,
    );
    assert.strictEqual(isNonReservableStatus(RESERVATION_STATUS.CLOSED), true);
    assert.strictEqual(
      isNonReservableStatus(RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF),
      true,
    );
    assert.strictEqual(
      isNonReservableStatus(RESERVATION_STATUS.NOT_YET_RESERVABLE),
      true,
    );
  });

  await t.test("should return false for reservable statuses", () => {
    assert.strictEqual(isNonReservableStatus("Available"), false);
    assert.strictEqual(isNonReservableStatus("Open"), false);
    assert.strictEqual(isNonReservableStatus("Reserved"), false);
    assert.strictEqual(isNonReservableStatus("Checkout"), false);
    assert.strictEqual(isNonReservableStatus("Some Other Status"), false);
  });
});

test("availability helpers", async (t) => {
  await t.test("isAvailableForCheckIn", () => {
    assert.strictEqual(isAvailableForCheckIn("Available"), true);
    assert.strictEqual(isAvailableForCheckIn("Open"), true);
    assert.strictEqual(isAvailableForCheckIn("Checkout"), false);
    assert.strictEqual(isAvailableForCheckIn("Reserved"), false);
  });

  await t.test("isCheckoutOnlyStatus", () => {
    assert.strictEqual(isCheckoutOnlyStatus("Checkout"), true);
    assert.strictEqual(isCheckoutOnlyStatus("Open"), false);
  });

  await t.test("isAlertableStatus", () => {
    assert.strictEqual(isAlertableStatus("Reserved"), true);
    assert.strictEqual(isAlertableStatus("NYR"), true);
    assert.strictEqual(isAlertableStatus("Checkout"), true);
    assert.strictEqual(isAlertableStatus("Available"), false);
  });

  await t.test("getAvailabilityCategory", () => {
    assert.strictEqual(getAvailabilityCategory("Available"), "available");
    assert.strictEqual(getAvailabilityCategory("Open"), "available");
    assert.strictEqual(getAvailabilityCategory("Reserved"), "reserved");
    assert.strictEqual(getAvailabilityCategory("NYR"), "nyr");
    assert.strictEqual(getAvailabilityCategory("Checkout"), "checkout");
    assert.strictEqual(
      getAvailabilityCategory(RESERVATION_STATUS.NOT_AVAILABLE),
      "not-reservable",
    );
    assert.strictEqual(getAvailabilityCategory("Unknown"), "reserved");
  });
});

test("RESERVATION_STATUS constants", async (t) => {
  await t.test("should have expected status constants", () => {
    assert.strictEqual(RESERVATION_STATUS.AVAILABLE, "Available");
    assert.strictEqual(RESERVATION_STATUS.OPEN, "Open");
    assert.strictEqual(RESERVATION_STATUS.RESERVED, "Reserved");
    assert.strictEqual(RESERVATION_STATUS.CHECKOUT_ONLY, "Checkout");
    assert.strictEqual(RESERVATION_STATUS.NOT_RESERVABLE, "Not Reservable");
    assert.strictEqual(RESERVATION_STATUS.NOT_AVAILABLE, "Not Available");
    assert.strictEqual(RESERVATION_STATUS.CLOSED, "Closed");
    assert.strictEqual(
      RESERVATION_STATUS.NOT_AVAILABLE_CUTOFF,
      "Not Available Cutoff",
    );
    assert.strictEqual(RESERVATION_STATUS.NOT_YET_RESERVABLE, "NYR");
  });
});
