/** One coordinate system for node cores and their SVG connections.
 * Coordinates are percentages of the 800 × 500 network canvas. Edges meet
 * the horizontal perimeter of each core, so a label or hover scale cannot
 * silently move the path away from its node. */
export type AtlasFocus = 'brief' | 'audience' | 'offer' | 'evidence' | 'estimate' | 'review';
export type AtlasNodeGeometry = { id: AtlasFocus; x: number; y: number; radius: number };
export type AtlasLink = { id: string; from: AtlasFocus; to: AtlasFocus; tone: 'copper' | 'mint' | 'violet' };

export const ATLAS_NODES: AtlasNodeGeometry[] = [
  { id: 'brief', x: 13, y: 50, radius: 33 },
  { id: 'audience', x: 35, y: 25, radius: 26 },
  { id: 'offer', x: 35, y: 75, radius: 26 },
  { id: 'evidence', x: 64, y: 19, radius: 26 },
  { id: 'estimate', x: 64, y: 60, radius: 26 },
  { id: 'review', x: 88, y: 50, radius: 26 },
];

export const ATLAS_VIEWBOX = { width: 800, height: 500 } as const;
export function atlasNode(id: AtlasFocus): AtlasNodeGeometry {
  const node = ATLAS_NODES.find(item => item.id === id);
  if (!node) throw new Error(`Unknown atlas node: ${id}`);
  return node;
}
export function edgeAnchors(from: AtlasFocus, to: AtlasFocus, width: number = ATLAS_VIEWBOX.width, height: number = ATLAS_VIEWBOX.height) {
  const source = atlasNode(from), target = atlasNode(to);
  return {
    start: { x: source.x / 100 * width + source.radius, y: source.y / 100 * height },
    end: { x: target.x / 100 * width - target.radius, y: target.y / 100 * height },
  };
}
export function edgePath(from: AtlasFocus, to: AtlasFocus, width: number = ATLAS_VIEWBOX.width, height: number = ATLAS_VIEWBOX.height) {
  const { start, end } = edgeAnchors(from, to, width, height);
  const bend = (end.x - start.x) * .46;
  return `M${start.x} ${start.y} C${start.x + bend} ${start.y} ${end.x - bend} ${end.y} ${end.x} ${end.y}`;
}

const dependencies: AtlasLink[] = [
  { id: 'brief-audience', from: 'brief', to: 'audience', tone: 'copper' },
  { id: 'brief-offer', from: 'brief', to: 'offer', tone: 'copper' },
  { id: 'audience-evidence', from: 'audience', to: 'evidence', tone: 'mint' },
  { id: 'audience-estimate', from: 'audience', to: 'estimate', tone: 'mint' },
  { id: 'offer-estimate', from: 'offer', to: 'estimate', tone: 'violet' },
  { id: 'evidence-review', from: 'evidence', to: 'review', tone: 'mint' },
  { id: 'estimate-review', from: 'estimate', to: 'review', tone: 'violet' },
];
export const ATLAS_LINKS: AtlasLink[] = dependencies;
