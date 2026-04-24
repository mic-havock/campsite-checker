const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/campground-availability');

  await page.evaluate(() => {
    const state = {
      availabilityData: {
        campsites: {
          "1": {
            site: "001",
            loop: "A",
            availabilities: {
              "2024-05-01T00:00:00Z": "Available",
              "2024-05-02T00:00:00Z": "Reserved",
              "2024-05-03T00:00:00Z": "NYR"
            }
          },
          "2": {
            site: "002",
            loop: "B",
            availabilities: {
              "2024-05-01T00:00:00Z": "Reserved",
              "2024-05-02T00:00:00Z": "Available",
              "2024-05-03T00:00:00Z": "Available"
            }
          }
        }
      },
      facilityID: "123",
      facilityName: "Test Campground",
      facilityState: "CA"
    };
    // React Router 6 uses 'usr' key for state in history.state
    window.history.replaceState({ usr: state, key: 'default' }, '', window.location.href);
  });

  await page.reload();

  try {
    await page.waitForSelector('.ag-theme-alpine', { timeout: 5000 });
    console.log("Grid found!");
  } catch (e) {
    console.log("Grid not found");
  }

  await page.screenshot({ path: '/home/jules/verification/screenshots/grid_success.png', fullPage: true });

  await browser.close();
})();
