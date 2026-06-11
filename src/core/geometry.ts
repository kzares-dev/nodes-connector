import type { ConnectorPath, GraphNode, NodeRect, Point, Viewport } from "./types";

export function getNodeCenter(node: NodeRect | GraphNode): Point {
  return {
    x: node.x + (node.width ?? 0) / 2,
    y: node.y + (node.height ?? 0) / 2
  };
}

export function createConnectorPath(from: NodeRect, to: NodeRect): ConnectorPath {
  const start = getNodeCenter(from);
  const end = getNodeCenter(to);
  const distance = Math.max(80, Math.abs(end.x - start.x) * 0.5);
  const c1 = { x: start.x + distance, y: start.y };
  const c2 = { x: end.x - distance, y: end.y };

  return {
    start,
    end,
    d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
  };
}

export function clampZoom(zoom: number, minZoom = 0.25, maxZoom = 2): number {
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

export function zoomViewport(
  viewport: Viewport,
  nextZoom: number,
  anchor: Point,
  minZoom?: number,
  maxZoom?: number
): Viewport {
  const zoom = clampZoom(nextZoom, minZoom, maxZoom);
  const worldX = (anchor.x - viewport.x) / viewport.zoom;
  const worldY = (anchor.y - viewport.y) / viewport.zoom;

  return {
    zoom,
    x: anchor.x - worldX * zoom,
    y: anchor.y - worldY * zoom
  };
}
