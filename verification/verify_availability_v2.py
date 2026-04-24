from playwright.sync_api import sync_playwright
import os

def run_verification(page):
    # Navigate to the page
    page.goto("http://localhost:3000/campground-availability")
    page.wait_for_timeout(1000)

    # Inject state into history to mock the availability data
    page.evaluate("""
        const state = {
            availabilityData: {
                campsites: {
                    "1": {
                        site: "001",
                        loop: "A",
                        availabilities: {
                            "2024-05-01T00:00:00Z": "Available",
                            "2024-05-02T00:00:00Z": "Reserved",
                            "2024-05-03T00:00:00Z": "NYR",
                            "2024-05-04T00:00:00Z": "Open",
                            "2024-05-05T00:00:00Z": "Reserved"
                        }
                    },
                    "2": {
                        site: "002",
                        loop: "B",
                        availabilities: {
                            "2024-05-01T00:00:00Z": "Reserved",
                            "2024-05-02T00:00:00Z": "Available",
                            "2024-05-03T00:00:00Z": "Available",
                            "2024-05-04T00:00:00Z": "Available",
                            "2024-05-05T00:00:00Z": "Available"
                        }
                    }
                }
            },
            facilityID: "123",
            facilityName: "Playwright Test Campground",
            facilityState: "CA"
        };
        window.history.replaceState({ usr: state, key: 'default' }, '', window.location.href);
    """)

    # Reload to pick up the state
    page.reload()
    page.wait_for_timeout(2000)

    # Check if grid is visible
    try:
        page.wait_for_selector(".ag-theme-alpine", timeout=5000)
        print("Success: AG Grid rendered with mock data")
    except Exception as e:
        print(f"Error: AG Grid not found. {e}")

    # Scroll a bit
    page.mouse.wheel(0, 300)
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/final_verification.png", full_page=True)
    print("Screenshot saved to /home/jules/verification/screenshots/final_verification.png")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
