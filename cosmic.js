/* Shared, decorative sky. One timer between events; no particle/scroll loop. */
(() => {
  'use strict';
  const sky = document.querySelector('.cosmic-background');
  if (!sky || sky.querySelector('.space-events')) return;
  const layer = document.createElement('div');
  layer.className = 'space-events';
  layer.setAttribute('aria-hidden', 'true');
  sky.append(layer);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)');
  const animations = new Set();
  let timer = 0;
  let suspended = false;
  const random = (min, max) => min + Math.random() * (max - min);
  const enabled = () => !document.hidden && !reduced.matches && !suspended;
  const point = (x, y, scale = 1) => `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  function animate(node, frames, options) {
    layer.append(node);
    const animation = node.animate(frames, { fill: 'both', ...options });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => {
      animations.delete(animation);
      node.remove();
    });
  }
  function clearEvents() {
    for (const animation of animations) animation.cancel();
    animations.clear();
    layer.replaceChildren();
  }
  function object(kind, angle) {
    const node = document.createElement('div');
    node.className = `space-flight space-${kind}`;
    const heading = document.createElement('span');
    heading.className = 'space-heading';
    heading.style.transform = `rotate(${angle}rad)`;
    node.append(heading);
    return { node, heading };
  }
  // Distance along the ray to the screen edge; the extra tail length makes the
  // whole streak leave the viewport instead of popping out in the middle.
  function exitDistance(x, y, dx, dy, width, height) {
    const horizontal = dx > 0 ? (width - x) / dx : -x / dx;
    const vertical = dy > 0 ? (height - y) / dy : -y / dy;
    return Math.min(horizontal, vertical) + 220;
  }
  function streaks(kind, width, height) {
    const small = compact.matches || navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4;
    // Most shooting-star events are small showers: 65% groups, 35% singles.
    const count = kind === 'shooting' ? (Math.random() < .35 ? 1 : (small ? 2 : 3)) : 1;
    const angle = random(.25, .8) + (Math.random() < .5 ? 0 : Math.PI);
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const originX = random(.12, .88) * width, originY = random(.12, .88) * height;
    for (let i = 0; i < count; i++) {
      const x = Math.max(10, Math.min(width - 10, originX + i * 28));
      const y = Math.max(10, Math.min(height - 10, originY - i * 34));
      const distance = exitDistance(x, y, dx, dy, width, height);
      const { node } = object(kind, angle);
      const duration = kind === 'shooting' ? random(1700, 2600) : random(3400, 4500);
      animate(node, [
        { transform: point(x, y), opacity: 0, offset: 0 },
        { transform: point(x + dx * distance * .06, y + dy * distance * .06), opacity: .85, offset: .06 },
        { transform: point(x + dx * distance, y + dy * distance), opacity: .85, offset: 1 }
      ], { duration, delay: i * 180, easing: 'linear' });
    }
  }
  function portal(x, y, angle, delay) {
    const { node } = object('portal', angle);
    animate(node, [
      { transform: point(x, y, .05), opacity: 0 },
      { transform: point(x, y, 1), opacity: .9, offset: .25 },
      { transform: point(x, y, 1), opacity: .8, offset: .7 },
      { transform: point(x, y, .05), opacity: 0 }
    ], { duration: 1200, delay, easing: 'ease-in-out' });
  }
  function spaceship(width, height) {
    const reverse = Math.random() < .5;
    const x = width * random(reverse ? .7 : .12, reverse ? .88 : .3);
    const y = height * random(.18, .82);
    const endX = width * random(reverse ? .12 : .7, reverse ? .3 : .88);
    const endY = height * random(.18, .82);
    const angle = Math.atan2(endY - y, endX - x);
    const { node, heading } = object('ship', angle);
    // Small inline vector, not a downloaded sprite or an animated blur.
    heading.innerHTML = '<svg viewBox="0 0 88 48" aria-hidden="true"><path fill="#bca5ff" d="M27 21 12 3l31 13L78 24 43 32 12 45l15-18z"/><path fill="#f2e9d6" d="m17 24 29-10 37 10-37 10z"/><path fill="#49306e" d="m44 18 20 6-20 6z"/><path fill="#f7d656" d="m17 20-17 4 17 4z"/><path fill="#d9ccff" d="m33 14 7-7 11 9M33 34l7 7 11-9"/></svg>';
    const at = amount => point(x + (endX - x) * amount, y + (endY - y) * amount);
    portal(x, y, angle, 0);
    animate(node, [
      { transform: point(x, y, .1), opacity: 0, offset: 0 },
      { transform: at(.1), opacity: .85, offset: .12 },
      { transform: at(.9), opacity: .85, offset: .88 },
      { transform: point(endX, endY, .1), opacity: 0, offset: 1 }
    ], { duration: 3900, delay: 300, easing: 'linear' });
    portal(endX, endY, angle, 3400);
  }
  function schedule() {
    clearTimeout(timer);
    sky.classList.toggle('space-paused', !enabled());
    if (!enabled()) { clearEvents(); return; }
    timer = setTimeout(() => {
      if (!enabled()) return;
      // Every normal effect ends before five seconds. Also guard against late
      // animation completion on a busy device so scenes never accumulate.
      if (animations.size) { schedule(); return; }
      // Measure once per event, never during its animation.
      const { width, height } = layer.getBoundingClientRect();
      const choice = Math.random();
      if (choice < .6) streaks('shooting', width, height);
      else if (choice < .68) streaks('comet', width, height);
      else if (choice < .84) streaks('meteor', width, height);
      else spaceship(width, height);
      schedule();
    }, random(5000, 10000));
  }
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  window.addEventListener('resize', clearEvents, { passive: true });
  window.addEventListener('pagehide', () => { suspended = true; schedule(); });
  window.addEventListener('pageshow', () => { suspended = false; schedule(); });
  schedule();
})();
