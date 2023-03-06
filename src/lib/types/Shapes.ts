export type Point = {
  x: number
  y: number
};

export type CanvasNode = {
  point: Point
  radius: number
};

export enum CanvasNodeConnPosition {
  top = 0b1,
  topRight = 0b10,
  right = 0b100,
  rightBottom = 0b1000,
  bottom = 0b10000,
  bottomLeft = 0b100000,
  left = 0b1000000,
  leftTop = 0b10000000
};

export type CanvasNodeConnections = {
  nodeA: { point: Point, position: CanvasNodeConnPosition }
  nodeB: { point: Point, position: CanvasNodeConnPosition }
};

export enum NodeSection {
  oneFourth = 2.5,
  half = 2,
  threeFourth = 1.5,
  full = 1
};

export enum EdgeConnectionType {
  straight = 0b1,
  curved = 0b10
};

export type nodeArcAutoPositionProps = {
  center: Point
  centerRadius: number
  nodesRadius: number
  nodesCount: number
  startAngle: number
  gap: number
  section: NodeSection
};

export type FontStyle = {
  fontWeight: number,
  fontFamily: string,
  fontSize: number
}

export type FontSettings = {
  maxWidth: number,
  maxHeight: number,
  maxSingleLine?: number,
  zoom?: number
}