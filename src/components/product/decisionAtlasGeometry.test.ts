import { describe, expect, it } from 'vitest';
import { ATLAS_LINKS, ATLAS_NODES, atlasNode, edgeAnchors, edgePath } from './decisionAtlasGeometry';

describe('decision network geometry', () => {
  it('lands every dependency on the right and left edge of its node core at desktop and compact widths', () => {
    for (const [width, height] of [[1080, 378], [620, 344]]) {
      for (const link of ATLAS_LINKS) {
        const source = atlasNode(link.from), target = atlasNode(link.to);
        const { start, end } = edgeAnchors(link.from, link.to, width, height);
        expect(start).toEqual({ x: source.x / 100 * width + source.radius, y: source.y / 100 * height });
        expect(end).toEqual({ x: target.x / 100 * width - target.radius, y: target.y / 100 * height });
        expect(start.x).toBeLessThan(end.x);
        expect(edgePath(link.from, link.to, width, height)).toMatch(new RegExp(`^M${start.x} ${start.y} C.* ${end.x} ${end.y}$`));
      }
    }
    expect(ATLAS_NODES).toHaveLength(6);
  });
});
