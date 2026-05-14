import { test, expect } from '@playwright/test';

test('diagnose checkbox borders', async ({ page }) => {
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
            "2026-06-01T00:00:00Z": "Available",
            "2026-06-02T00:00:00Z": "Reserved"
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

  // Wait for grid
  await page.waitForSelector('.ag-row');

  const rowCheckbox = page.locator('.ag-row [role="checkbox"]').first();
  const wrapper = rowCheckbox.locator('.ag-checkbox-input-wrapper');

  // Zoom in
  await page.evaluate(() => {
    document.body.style.zoom = "300%";
  });

  await page.screenshot({ path: 'diagnose_unchecked_v2.png' });

  const styles = await wrapper.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    const before = window.getComputedStyle(el, '::before');
    const after = window.getComputedStyle(el, '::after');
    const input = window.getComputedStyle(el.querySelector('input'));

    return {
      wrapper: {
        border: computed.border,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        borderRadius: computed.borderRadius
      },
      before: {
        content: before.content,
        border: before.border,
        borderWidth: before.borderWidth,
        display: before.display,
        boxShadow: before.boxShadow,
        outline: before.outline
      },
      after: {
        content: after.content,
        border: after.border,
        borderWidth: after.borderWidth,
        display: after.display,
        boxShadow: after.boxShadow,
        outline: after.outline
      }
    };
  });

  console.log('Checkbox Styles:', JSON.stringify(styles, null, 2));

  // Focus it
  await rowCheckbox.focus();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'diagnose_focused_v2.png' });

  const focusedStyles = await wrapper.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      outline: computed.outline,
      boxShadow: computed.boxShadow,
      border: computed.border
    };
  });
  console.log('Focused Checkbox Styles:', JSON.stringify(focusedStyles, null, 2));
});
