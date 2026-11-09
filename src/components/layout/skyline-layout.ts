export const SKYLINE_WIDTH = 1600;
export const SKYLINE_HEIGHT = 420;

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 4294967296;
const START_X = -20;
const WINDOW_PADDING_X = 12;
const WINDOW_GAP_X = 8;
const WINDOW_HEIGHT = 10;
const WINDOW_GAP_Y = 10;
const WINDOW_TOP_OFFSET = 14;
const WINDOW_BOTTOM_MARGIN = 14;
const WINDOW_COLUMN_WIDTH = 28;
const WINDOW_RADIUS = 2.5;
const MIN_WINDOW_WIDTH = 5;

export interface SkylineBuilding {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SkylineLayer {
  seed: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  gap: number;
}

/** Back layer is taller and fainter, the front layer shorter and stronger. */
export const SKYLINE_LAYERS = {
  back: {
    seed: 7,
    minHeight: 130,
    maxHeight: 290,
    minWidth: 56,
    maxWidth: 100,
    gap: 8,
  },
  front: {
    seed: 21,
    minHeight: 70,
    maxHeight: 170,
    minWidth: 64,
    maxWidth: 120,
    gap: 10,
  },
} satisfies Record<string, SkylineLayer>;

/** Deterministic buildings, so the server and the client render the same skyline. */
export function buildSkyline(layer: SkylineLayer): SkylineBuilding[] {
  let state = layer.seed;
  const random = () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
    return state / LCG_MODULUS;
  };

  const buildings: SkylineBuilding[] = [];
  for (let x = START_X; x < SKYLINE_WIDTH - START_X;) {
    const width = Math.round(
      layer.minWidth + random() * (layer.maxWidth - layer.minWidth)
    );
    const height = Math.round(
      layer.minHeight + random() * (layer.maxHeight - layer.minHeight)
    );
    buildings.push({ x, y: SKYLINE_HEIGHT - height, width, height });
    x += width + layer.gap;
  }
  return buildings;
}

function roundedRect(x: number, y: number, width: number, height: number) {
  const r = WINDOW_RADIUS;
  return (
    `M${x + r} ${y}h${width - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${height - 2 * r}` +
    `a${r} ${r} 0 0 1 ${-r} ${r}h${-(width - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}` +
    `v${-(height - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`
  );
}

/** One SVG path with every window of the given buildings, laid out like skeleton bars. */
export function windowsPath(buildings: SkylineBuilding[]): string {
  const paths: string[] = [];
  for (const building of buildings) {
    const columns = Math.max(
      1,
      Math.floor(building.width / WINDOW_COLUMN_WIDTH)
    );
    const width =
      (building.width - WINDOW_PADDING_X * 2 - (columns - 1) * WINDOW_GAP_X) /
      columns;
    if (width < MIN_WINDOW_WIDTH) continue;

    for (
      let y = building.y + WINDOW_TOP_OFFSET;
      y < SKYLINE_HEIGHT - WINDOW_BOTTOM_MARGIN;
      y += WINDOW_HEIGHT + WINDOW_GAP_Y
    ) {
      for (let column = 0; column < columns; column++) {
        const x =
          building.x + WINDOW_PADDING_X + column * (width + WINDOW_GAP_X);
        paths.push(roundedRect(x, y, width, WINDOW_HEIGHT));
      }
    }
  }
  return paths.join('');
}
