import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async def handle_route(route):
        url = route.request.url
        if "reservations" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({
                "reservations": [
                    {"id": 1, "campsite_name": "Site 1", "campsite_number": "001", "monitoring_active": 1, "campground_name": "Camp A", "arrival_date": "2024-01-01", "departure_date": "2024-01-05"},
                    {"id": 2, "campsite_name": "Site 2", "campsite_number": "002", "monitoring_active": 0, "campground_name": "Camp B", "arrival_date": "2024-02-01", "departure_date": "2024-02-05"},
                    {"id": 3, "campsite_name": "Site 3", "campsite_number": "003", "monitoring_active": 1, "campground_name": "Camp C", "arrival_date": "2024-03-01", "departure_date": "2024-03-05"},
                    {"id": 4, "campsite_name": "Site 4", "campsite_number": "004", "monitoring_active": 1, "campground_name": "Camp D", "arrival_date": "2024-04-01", "departure_date": "2024-04-05"},
                    {"id": 5, "campsite_name": "Site 5", "campsite_number": "005", "monitoring_active": 0, "campground_name": "Camp E", "arrival_date": "2024-05-01", "departure_date": "2024-05-05"},
                    {"id": 6, "campsite_name": "Site 6", "campsite_number": "006", "monitoring_active": 1, "campground_name": "Camp F", "arrival_date": "2024-06-01", "departure_date": "2024-06-05"}
                ]
            }))
        elif "stats" in url:
             await route.fulfill(status=200, content_type="application/json", body=json.dumps({
                "stats": {"totalReservations": 6, "activeMonitoring": 4, "successfulNotifications": 0, "totalAttempts": 20}
            }))
        else:
            await route.continue_()

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1280px
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        await page.route("**/*", handle_route)
        await page.goto("http://localhost:5173/reservation-management")
        await page.wait_for_selector('input[type="email"]')
        await page.fill('input[type="email"]', 'test@example.com')
        await page.click('button:has-text("Search")')
        await page.wait_for_selector('.reservations-grid')
        await page.screenshot(path="centered_1280.png")

        # 2560px
        await page.set_viewport_size({'width': 2560, 'height': 1440})
        await page.screenshot(path="centered_2560.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
