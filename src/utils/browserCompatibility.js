export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

export const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

export const isMobileDevice = () => {
  return window.innerWidth < 768;
};

export const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

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

export const initBrowserCompatibility = () => {
  setViewportHeight();

  addDeviceClasses();

  window.addEventListener("resize", () => {
    setViewportHeight();
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(setViewportHeight, 100);
  });
};
