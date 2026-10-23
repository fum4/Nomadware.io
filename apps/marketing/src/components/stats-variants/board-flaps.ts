// TEMPORARY (NWARE-82), stats variant b: mirrors every board number into a row of split-flap
// tiles. The real number stays in the DOM (visually hidden, read by screen readers and counted by
// scripts/stats-strip.ts); the tiles are aria-hidden and right-aligned in a fixed count, so a
// changing number never changes the row's width. A changed tile flips (a transform, not a flash,
// so it plays under reduced motion too); updates are throttled to a mechanical cadence.

const FLIP_CLASS = 'is-flipping';
const CADENCE_MS = 70;

function renderTiles(tiles: HTMLElement[], text: string): void {
  const padded = text.padStart(tiles.length, ' ').slice(-tiles.length);
  tiles.forEach((tile, index) => {
    const char = padded[index] ?? ' ';
    if (tile.textContent === char) return;
    tile.textContent = char;
    tile.classList.remove(FLIP_CLASS);
    // Restart the flip: the class must come off for a frame before it goes back on.
    void tile.offsetWidth;
    tile.classList.add(FLIP_CLASS);
  });
}

export function initBoardFlaps(): void {
  document.querySelectorAll<HTMLElement>('[data-flaps]').forEach((row) => {
    const source = row.querySelector<HTMLElement>('[data-stat]');
    const tiles = [...row.querySelectorAll<HTMLElement>('[data-flap]')];
    if (!source || tiles.length === 0) return;
    let last = 0;
    let pending = 0;
    const sync = (): void => {
      pending = 0;
      last = performance.now();
      renderTiles(tiles, source.textContent?.trim() ?? '');
    };
    new MutationObserver(() => {
      if (pending !== 0) return;
      pending = window.setTimeout(sync, Math.max(0, CADENCE_MS - (performance.now() - last)));
    }).observe(source, { childList: true, characterData: true, subtree: true });
    sync();
  });
}
