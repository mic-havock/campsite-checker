import { test } from '@playwright/test';

test('debug page load', async ({ page }) => {
  const mockState = {
    facilityName: "Test Campground",
    facilityID: "123",
    stateCode: "CA",
    availabilityData: {
      campsites: {
        "G191": {
          site: "G191",
          loop: "G Loop",
          availabilities: {
            "2026-06-01T00:00:00Z": "Available"
          }
        }
      }
    }
  };

  await page.goto('http://localhost:5173/campground-availability');
  await page.evaluate((state) => {
    window.history.replaceState({ usr: state }, '');
  }, mockState);
  await page.reload();

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'page_load.png', fullPage: true });
  console.log('Page Title:', await page.title());
});
