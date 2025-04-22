/**
 * Utility functions for browser compatibility and mobile optimization
 */

/**
 * Sets the CSS viewport height variable used to fix the 100vh issue on mobile browsers
 * This is needed because mobile browsers (especially iOS Safari) handle the viewport height differently
 */
export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

/**
 * Detects if the device is a touch device
 * @returns {boolean} True if touch device
 */
export const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Detects if the device is a mobile device based on screen size
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
  return window.innerWidth < 768;
};

/**
 * Detects iOS devices, which often need special handling
 * @returns {boolean} True if iOS device
 */
export const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

/**
 * Adds a class to the body indicating device type
 */
export const addDeviceClasses = () => {
  if (isTouchDevice()) {
    document.body.classList.add("touch-device");
  } else {
    document.body.classList.add("no-touch");
  }

  if (isMobileDevice()) {
    document.body.classList.add("mobile-device");
  } else {
    document.body.classList.add("desktop-device");
  }

  if (isIOS()) {
    document.body.classList.add("ios-device");
  }
};

/**
 * Fixes modal scrolling issues on iOS
 */
export const fixIOSModalScrolling = () => {
  const scrollY = window.scrollY;

  return {
    lockScroll: () => {
      if (!isIOS()) return;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    },
    unlockScroll: () => {
      if (!isIOS()) return;

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    },
  };
};

/**
 * Initialize all browser compatibility fixes
 */
export const initBrowserCompatibility = () => {
  // Set initial viewport height
  setViewportHeight();

  // Add device type classes to body
  addDeviceClasses();

  // Update viewport height on resize
  window.addEventListener("resize", () => {
    setViewportHeight();
  });

  // Update on orientation change (important for mobile)
  window.addEventListener("orientationchange", () => {
    // Small delay to ensure correct calculation after rotation
    setTimeout(setViewportHeight, 100);
  });
};
