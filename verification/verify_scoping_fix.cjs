const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Verify Campground Availability Grid (Scoped styling should be active)
  const mockAvailability = {
    campsites: {
      "1": {
        site: "001",
        loop: "A",
        availabilities: {
          "2026-05-01T00:00:00Z": "Available"
        }
      }
    }
  };
  const mockState = {
    availabilityData: mockAvailability,
    facilityID: "123",
    facilityName: "SCOPED GRID TEST"
  };

  await page.goto('http://localhost:5173/campground-availability');
  await page.evaluate((state) => {
    window.history.replaceState({ usr: state }, '');
    window.location.reload();
  }, mockState);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/screenshots/scoped_availability_grid.png' });

  // 2. Verify Facilities Finder Grid (Should have normal AG Grid styling, no tiles)
  await page.goto('http://localhost:5173/');
  // Perform a search to show the grid
  await page.getByRole('textbox', { name: /search/i }).fill('Yosemite');
  await page.getByRole('button', { name: /search/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/screenshots/facilities_finder_grid_reverted.png' });

  await context.close();
  await browser.close();
})();
