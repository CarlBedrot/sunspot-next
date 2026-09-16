// CSS is the single source of truth, including for Leaflet and Canvas colors.
// Read at layer creation time, after the app stylesheet has loaded.
export function mapColors() {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    ["blue", "sky", "grass", "cream", "ink", "surface"].map((name) => [
      name,
      style.getPropertyValue(`--${name}`).trim(),
    ]),
  );
}
