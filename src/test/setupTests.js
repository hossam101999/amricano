import "@testing-library/jest-dom/vitest";

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

try {
  Object.defineProperty(window.navigator, "standalone", {
    configurable: true,
    value: false,
  });
} catch {
  // Ignore if the environment blocks redefining navigator.standalone.
}
