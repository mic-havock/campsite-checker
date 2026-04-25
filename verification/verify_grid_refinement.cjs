const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jules/verification/videos'
    }
  });
  const page = await context.newPage();

  // Mock the availability data in session storage / location state
  const mockAvailability = {
    campsites: {
      "1": {
        site: "001",
        loop: "A",
        availabilities: {
          "2026-05-01T00:00:00Z": "Available",
          "2026-05-02T00:00:00Z": "Reserved",
          "2026-05-03T00:00:00Z": "NYR",
          "2026-05-04T00:00:00Z": "Available",
          "2026-05-05T00:00:00Z": "Reserved"
        }
      }
    }
  };

  const mockState = {
    availabilityData: mockAvailability,
    facilityID: "123",
    facilityName: "GRID REFINEMENT TEST",
    facilityState: "CA"
  };

  // We need to bypass the real app logic and just show the component with our mock state
  await page.goto('http://localhost:5173/campground-availability');

  // Inject state into history
  await page.evaluate((state) => {
    window.history.replaceState({ usr: state }, '');
    window.location.reload();
  }, mockState);

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for AG Grid to render

  // Verify the grid appearance
  await page.screenshot({ path: '/home/jules/verification/screenshots/grid_refinement_tiled.png' });

  // Test clicking 'NYR' cell (the blue one, 5/3 date column)
  const nyrCell = page.locator('.ag-row[row-index="0"] .ag-cell[col-id="2026-05-03"]');
  await nyrCell.click();
  await page.waitForTimeout(1000);

  // Check if AlertModal opened
  const modalVisible = await page.isVisible('.alert-modal');
  console.log('NYR Modal Visible:', modalVisible);
  await page.screenshot({ path: '/home/jules/verification/screenshots/nyr_click_modal.png' });

  await context.close();
  await browser.close();
})();
