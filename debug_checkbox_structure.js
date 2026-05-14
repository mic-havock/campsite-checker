import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const mockState = {
    availabilityData: {
      campsites: {
        'site1': {
           site: '101',
           loop: 'Loop A',
           availabilities: {
             '2026-05-14T00:00:00Z': 'Available'
           }
        }
      }
    },
    facilityID: '123',
    facilityName: 'TEST CAMPGROUND'
  };

  console.log('Setting up init script...');
  // React Router 6/7 stores state in history.state.usr
  await page.addInitScript((state) => {
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(s, t, u) {
      if (u === '/campground-availability') {
        return originalReplaceState.apply(this, [{ ...s, usr: state }, t, u]);
      }
      return originalReplaceState.apply(this, arguments);
    };
    // Pre-seed the state
    originalReplaceState.call(window.history, { usr: state }, '', window.location.href);
  }, mockState);

  console.log('Navigating...');
  await page.goto('http://localhost:5173/campground-availability', { waitUntil: 'networkidle' });

  // Alternative state injection if the above failed
  await page.evaluate((state) => {
    window.history.replaceState({ usr: state }, '');
    window.dispatchEvent(new Event('popstate'));
  }, mockState);

  console.log('Waiting for content...');
  await page.screenshot({ path: 'debug_page_state.png' });

  try {
    await page.waitForSelector('.ag-root-wrapper', { timeout: 5000 });
    console.log('Found grid!');
  } catch (e) {
    console.log('Grid not found, checking for "No data" view');
    const hasNoData = await page.evaluate(() => document.body.innerText.includes('No availability data found'));
    console.log('Has "No data" view:', hasNoData);
  }

  const checkboxData = await page.evaluate(() => {
    const gridWrapper = document.querySelector('.ag-checkbox-input-wrapper');
    const hideInput = document.querySelector('#hideNotReservable');

    const getStyles = (el) => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const ps_before = window.getComputedStyle(el, ':before');
      const ps_after = window.getComputedStyle(el, ':after');
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        border: s.border,
        outline: s.outline,
        boxShadow: s.boxShadow,
        appearance: s.appearance,
        webkitAppearance: s.webkitAppearance,
        opacity: s.opacity,
        display: s.display,
        visibility: s.visibility,
        before: {
           border: ps_before.border,
           content: ps_before.content,
           display: ps_before.display
        },
        after: {
           border: ps_after.border,
           content: ps_after.content,
           display: ps_after.display
        }
      };
    };

    return {
      gridCheckbox: getStyles(gridWrapper),
      gridInput: getStyles(gridWrapper?.querySelector('input')),
      hideCheckbox: getStyles(hideInput)
    };
  });

  console.log('STYLING_DIAGNOSIS:', JSON.stringify(checkboxData, null, 2));

  if (checkboxData.gridCheckbox) {
    const el = await page.$('.ag-checkbox-input-wrapper');
    await el.screenshot({ path: 'checkbox_grid.png' });
  }
  if (checkboxData.hideCheckbox) {
    const el = await page.$('#hideNotReservable');
    await el.screenshot({ path: 'checkbox_hide.png' });
  }

  await browser.close();
})();
