import { test } from '@playwright/test';

test('inspect checkbox styles', async ({ page }) => {
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

  const grid = page.locator('.ag-theme-alpine');
  await grid.waitFor();
  await page.waitForTimeout(2000);

  // Find any checkbox in the grid
  const checkbox = page.locator('.ag-checkbox').first();
  await checkbox.waitFor();

  const styles = await checkbox.evaluate((el) => {
    const wrapper = el.querySelector('.ag-checkbox-input-wrapper');
    const input = el.querySelector('input');
    const computed = window.getComputedStyle(wrapper);
    const before = window.getComputedStyle(wrapper, '::before');
    const after = window.getComputedStyle(wrapper, '::after');

    return {
      wrapper: {
        border: computed.border,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        backgroundColor: computed.backgroundColor
      },
      before: {
        display: before.display,
        border: before.border,
        boxShadow: before.boxShadow
      },
      after: {
        display: after.display,
        border: after.border,
        boxShadow: after.boxShadow
      }
    };
  });

  console.log('STYLING_DIAGNOSIS:' + JSON.stringify(styles, null, 2));

  // Focus it to see if focus ring appears
  await checkbox.focus();
  await page.waitForTimeout(500);

  const focusedStyles = await checkbox.evaluate((el) => {
    const wrapper = el.querySelector('.ag-checkbox-input-wrapper');
    const computed = window.getComputedStyle(wrapper);
    return {
      outline: computed.outline,
      boxShadow: computed.boxShadow,
      border: computed.border
    };
  });
  console.log('FOCUSED_DIAGNOSIS:' + JSON.stringify(focusedStyles, null, 2));

  await page.evaluate(() => { document.body.style.zoom = "300%"; });
  await page.screenshot({ path: 'checkbox_zoom_final.png' });
});
