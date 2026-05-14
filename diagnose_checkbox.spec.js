import { test, expect } from '@playwright/test';

test('diagnose checkbox borders', async ({ page }) => {
  const mockState = {
    facilityName: "Test Campground",
    facilityId: "123",
    stateCode: "CA"
  };

  await page.goto('http://localhost:5173/campground-availability');
  await page.evaluate((state) => {
    window.history.replaceState({ usr: state }, '');
  }, mockState);
  await page.reload();

  const monthSelect = page.locator('select[aria-label="Select a month"], #month-select');
  await monthSelect.waitFor({ state: 'visible' });
  await monthSelect.selectOption({ index: 1 });
  await page.click('button:has-text("Check")');

  await page.waitForSelector('.ag-row');

  const rowCheckbox = page.locator('.ag-row [role="checkbox"]').first();
  const wrapper = rowCheckbox.locator('.ag-checkbox-input-wrapper');

  // Zoom in for better visibility in screenshot
  await page.evaluate(() => {
    document.body.style.zoom = "300%";
  });

  await page.screenshot({ path: 'diagnose_unchecked.png' });

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
        appearance: computed.appearance,
        webkitAppearance: computed.webkitAppearance
      },
      before: {
        content: before.content,
        border: before.border,
        borderWidth: before.borderWidth,
        display: before.display,
        position: before.position
      },
      after: {
        content: after.content,
        border: after.border,
        borderWidth: after.borderWidth,
        display: after.display,
        position: after.position
      },
      input: {
        opacity: input.opacity,
        position: input.position,
        appearance: input.appearance,
        webkitAppearance: input.webkitAppearance,
        border: input.border
      }
    };
  });

  console.log('Checkbox Styles:', JSON.stringify(styles, null, 2));
});
