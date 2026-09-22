const MIN_WIDTH = 720;
const MIN_HEIGHT = 480;

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function centeredBounds(display, width, height) {
  const area = display.workArea || display;
  return {
    x: area.x + Math.floor((area.width - width) / 2),
    y: area.y + Math.floor((area.height - height) / 2),
    width,
    height,
  };
}

function restoreWindowState(saved, displays, primaryDisplay, fallbackBounds) {
  const fallback = fallbackBounds || {
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  };
  const raw = saved?.bounds || fallback;
  const bounds = {
    x: Number.isFinite(raw.x) ? Math.round(raw.x) : undefined,
    y: Number.isFinite(raw.y) ? Math.round(raw.y) : undefined,
    width: Math.max(MIN_WIDTH, Math.round(Number(raw.width) || fallback.width)),
    height: Math.max(MIN_HEIGHT, Math.round(Number(raw.height) || fallback.height)),
  };
  const visible =
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    displays.some((display) => intersects(bounds, display.workArea || display));

  return {
    bounds: visible
      ? bounds
      : centeredBounds(primaryDisplay.workArea || primaryDisplay, bounds.width, bounds.height),
    maximized: Boolean(saved?.maximized),
  };
}

module.exports = { MIN_WIDTH, MIN_HEIGHT, restoreWindowState };
