const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const mockAvailabilityData = {
    campsites: {
      "001": {
        site: "001",
        loop: "A",
        availabilities: {
          "2024-05-01T00:00:00Z": "Available",
          "2024-05-02T00:00:00Z": "Reserved",
          "2024-05-03T00:00:00Z": "NYR"
        }
      }
    }
  };

  const mockState = {
    availabilityData: mockAvailabilityData,
    facilityID: "123",
    facilityName: "BRUTE FORCE TEST",
    facilityState: "CA"
  };

  console.log('Navigating to Campground Availability via state injection...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  await page.evaluate((state) => {
    window.history.pushState({ usr: state }, '', '/campground-availability');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { usr: state } }));
  }, mockState);

  await page.waitForSelector('#availability-calendar-view');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/screenshots/availability_fixed_direct.png' });

  await browser.close();
})();
