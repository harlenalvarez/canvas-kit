import { CanvasNode, CanvasNodeConnections, CanvasNodeConnPosition, nodeArcAutoPositionProps, NodeSection, Optional, Point } from '@/types';

export const translateAngle = (angle: number) => angle - 90;

/**
 *
 * @param e object containing clientX and clientY poistion
 * @param ctx Canvas Rendering 2D context
 * @param offsetByScale Boolean value to use scale offset when checking for isPointInPath or isPointInStroke, for placing items in the canvas leave this as false
 * @returns array with x and y coordinates
 */
export const getCanvasPoint = (e: { clientX: number, clientY: number }, ctx?: CanvasRenderingContext2D, offsetByScale?: boolean): [number, number] => {
  if (ctx?.canvas == null) throw new Error('Canvas argument is undefined');
  const { left, top } = ctx.canvas.getBoundingClientRect();
  const scale = offsetByScale ? Math.ceil(window.devicePixelRatio) : 1;
  return [
    (e.clientX - left) * scale,
    (e.clientY - top) * scale
  ];
};

/**
 * Clears a 2d canvas
 * @param ctx - canvas 2d context
 */
export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
};

/**
 * Calculates the midpoint
 * @param point1 - {x,y} point
 * @param point2 - {x,y} point
 * @returns midpoint as {x,y}
 */
export const getMidPoint = (point1: Point, point2: Point): Point => {
  return { x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2 };
};

/**
 * Usefull to determine if we should connect two points with a stratight line or if we can curve it
 * @param point1 - {x,y} point
 * @param point2 - {x,y} point
 * @returns Slope, vertical slope resulting in infinity is returned as 0.
 */
export const getSlope = (point1: Point, point2: Point) => {
  if (point1.x - point2.x === 0) return 0;
  const slope = (point2.y - point1.y) / (point2.x - point1.x);
  return Math.round((slope + Number.EPSILON) * 10) / 10;
};
/**
 * Returns an approximated distance between two points rounded to two decimal points
 * @param point1 - {x,y} point
 * @param point2 - {x,y} point
 * @returns rounded distance
 */
export const getDistance = (point1: Point, point2: Point): number => {
  const squared = Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2);
  const sqroot = Math.sqrt(squared);
  // this round is not 100% accurate, but for what we're using it it's completly fine ( do not ever use this for accuracy or money transactions)
  const decimalDistance = Math.round((sqroot + Number.EPSILON) * 100) / 100;
  return decimalDistance;
};

// Normally we would use cos sin to get the edge at x, y, but we're not connecting directly to the circle ( there is a gap)
// so I figure it will be less intensive to simply get the points by just using the radius with a gap
/**
 * Gets approximate points to add connection lines to a node,
 * the accuracy is good enough for adding visual connecting lines but should not be used if it needs to be 100% on the circumference line
 * Too connect two nodes use the getConnectionPoints method
 * @param point - {x,y} 
 * @param radius - {x,y}
 * @param gap - gap from the circumfirence of the circle if any
 * @param points - how many points to use, 4 or 8 in a circle
 * @returns array with top, right, bottom, left attachment points in {x,y} format
 */
export const getNodeAttachentPoints = (point: Point, radius: number, gap: number = 0, points: 4 | 8 = 4): Point[] => {
  const gapRadius = radius + gap;
  const top = { x: point.x, y: point.y - gapRadius };
  const right = { x: point.x + gapRadius, y: point.y };
  const bottom = { x: point.x, y: point.y + gapRadius };
  const left = { x: point.x - gapRadius, y: point.y };

  if (points === 4)
    return [top, right, bottom, left];

  const degree45 = Math.PI * 0.25;
  const angleCos = Math.round(Math.cos(degree45) * 100) / 100;
  const angleSin = Math.round(Math.sin(degree45) * 100) / 100;

  const topRight = { x: point.x + gapRadius * angleCos, y: point.y - gapRadius * angleSin };
  const rightBottom = { x: point.x + gapRadius * angleCos, y: point.y + gapRadius * angleSin };
  const bottomLeft = { x: point.x - gapRadius * angleCos, y: point.y + gapRadius * angleSin };
  const leftTop = { x: point.x - gapRadius * angleCos, y: point.y - gapRadius * angleSin };

  return [top, topRight, right, rightBottom, bottom, bottomLeft, left, leftTop];
};

const positionMapFour = {
  0: CanvasNodeConnPosition.top,
  1: CanvasNodeConnPosition.right,
  2: CanvasNodeConnPosition.bottom,
  3: CanvasNodeConnPosition.left,
};

const positionMapEight = {
  0: CanvasNodeConnPosition.top,
  1: CanvasNodeConnPosition.topRight,
  2: CanvasNodeConnPosition.right,
  3: CanvasNodeConnPosition.rightBottom,
  4: CanvasNodeConnPosition.bottom,
  5: CanvasNodeConnPosition.bottomLeft,
  6: CanvasNodeConnPosition.left,
  7: CanvasNodeConnPosition.leftTop
};

const findClosestPoint = (nodePoints: Point[], midPoint: Point): { point: Point, position: CanvasNodeConnPosition } => {
  let closestPoint: [Point, number, number] = [{ x: 0, y: 0 }, Number.MAX_SAFE_INTEGER, -1];
  // no more then 4 points per node
  for (let x = 0; x < nodePoints.length; x++) {
    const point = nodePoints[x];
    const distance = getDistance(midPoint, point);
    if (distance < closestPoint[1]) {
      closestPoint = [point, distance, x];
    }
  }
  if (nodePoints.length === 4) {
    const index = closestPoint[2] as keyof typeof positionMapFour;
    return { point: closestPoint[0], position: positionMapFour[`${index}`] };
  }
  else {
    const index = closestPoint[2] as keyof typeof positionMapEight;
    return { point: closestPoint[0], position: positionMapEight[`${index}`] };
  }
};

/**
 * 
 * @param nodeA - CanvasNode { point: {x,y}, radius: number }
 * @param nodeB - CanvasNode { point: {x,y}, radius: number }
 * @param gap - gap between the connection line and the node
 * @param point - how many points to use in a node, 4 or 8 defaults to 4 
 * @returns - { nodeA: {x,y}, nodeB: {x,y}} to connect a line
 */
export const getNodeConnectionPoints = (nodeA: CanvasNode, nodeB: CanvasNode, gap: number = 0, points: 4 | 8 = 4): CanvasNodeConnections => {
  const midPoint = getMidPoint(nodeA.point, nodeB.point);
  const nodeAPoints = getNodeAttachentPoints(nodeA.point, nodeA.radius, gap, points);
  const nodeBPoints = getNodeAttachentPoints(nodeB.point, nodeB.radius, gap, points);

  const nodeAConnection = findClosestPoint(nodeAPoints, midPoint);
  const nodeBConnection = findClosestPoint(nodeBPoints, midPoint);
  return { nodeA: nodeAConnection, nodeB: nodeBConnection };
};

/**
 * Given point, a node radius size and node amount, it will return a method to that generates a nodes in a circle
 */
/**
 * This method tries to place a node graph tree on a canvas api
 * @param Object - { center, centerRadius, nodesRadius, nodesCount, startAngle = 0, gap = 10, section = NodeSection.full }
 * @param - center point { x, y } ( can be a parent node or just a point to start placing nodes around)
 * @param - centerRadius the radius of the center point ( this is the radius of parent node or just a small radius to place nodes around)
 * @param - nodesRadius - the radius of each node needed to be placed
 * @param - nodesCount - count of nodes to place
 * @param - startAngle - start angle to start placing nodes (default to 0: top)
 * @param - gap - extra gap around each node ( might need it for adding focus rings or other information )
 * @param - section - area of the circle to place nodes ( full, 1/4, half, or 3/4 ) for example 1/4 will place all nodes on 1/4 of a circle starting at the start angle
 * @returns - method that takes an index of the node placing and returns the point where that node needs to be placed
 */
export const nodeRadialPosition = ({ center, centerRadius, nodesRadius, nodesCount, startAngle = 0, gap = 10, section = NodeSection.full }: Optional<nodeArcAutoPositionProps, 'startAngle' | 'gap' | 'section'>): [(index: number) => Point, number, number] => {
  const nodesSectionCount = nodesCount * section;
  if (nodesSectionCount < 1) { throw new Error('Node Arc Auto Poisition did not recieved a node count'); }

  const diameterOfEachNode = nodesRadius * 2 + gap;
  const neededCircumference = diameterOfEachNode * nodesSectionCount;
  const radiusGap = Math.max(30, gap + 20);
  const nodeRadius = centerRadius + nodesRadius + radiusGap;

  const lvlRadius = Math.max(nodeRadius, (neededCircumference / (2 * Math.PI)));
  const offsetAngle = translateAngle(startAngle);
  const levelRadius = centerRadius + lvlRadius;
  const angleStep = (diameterOfEachNode / neededCircumference) * 360;

  function positionNode(index: number): Point {
    const radiansAngle = (index * angleStep + offsetAngle) * (Math.PI / 180);
    const x = Math.cos(radiansAngle) * levelRadius + center.x;
    const y = Math.sin(radiansAngle) * levelRadius + center.y;
    return { x, y };
  }
  return [positionNode, levelRadius, nodeRadius];
};

/**
 * Converts an alpha number to hex for hex css colors with a given alpha
 * @param alpa - numer  example: .7
 * @returns - hex string that can be postfix to a hex color
 */
export const fromAlpaToHex = (alpa: number) => {
  if (alpa > 1) return '';
  const percentage = alpa * 100;
  const decimalValue = Math.round((percentage * 255) / 100);
  return decimalValue.toString(16);
};

export const connectNodesWithCurvedLine = (parent: CanvasNode, child: CanvasNode, ctx: CanvasRenderingContext2D, gap: number = 0, connPoints: 4 | 8 = 4) => {
  const { nodeA, nodeB } = getNodeConnectionPoints(parent, child, gap, connPoints);
  const midPoint = getMidPoint(nodeA.point, nodeB.point);
  ctx.beginPath();
  ctx.moveTo(nodeA.point.x, nodeA.point.y);

  // we want to move toward the midPoint with a quadratic curve
  // if bottom or top start with nodes
  let radius = 30;
  const slope = getSlope(nodeA.point, nodeB.point);
  const diameter = radius * 2;
  const hasSpace = Math.abs(nodeA.point.x - nodeB.point.x) > diameter && Math.abs(nodeA.point.y - nodeB.point.y) > diameter;
  if (!slope || !hasSpace) {
    ctx.lineTo(nodeB.point.x, nodeB.point.y);
  } else if (nodeA.position & (CanvasNodeConnPosition.top | CanvasNodeConnPosition.bottom)) {
    if (slope > -0.2 && slope < 0.2) {
      radius = 3;
    }
    ctx.arcTo(nodeA.point.x, midPoint.y, midPoint.x, midPoint.y, radius);
    ctx.arcTo(nodeB.point.x, midPoint.y, nodeB.point.x, nodeB.point.y, radius);
    ctx.lineTo(nodeB.point.x, nodeB.point.y);
  }
  else if (nodeA.position & (CanvasNodeConnPosition.right | CanvasNodeConnPosition.left)) {
    if (slope > -0.2 && slope < 0.2) {
      radius = 3;
    }
    ctx.arcTo(midPoint.x, nodeA.point.y, midPoint.x, midPoint.y, radius);
    ctx.arcTo(midPoint.x, nodeB.point.y, nodeB.point.x, nodeB.point.y, radius);
    ctx.lineTo(nodeB.point.x, nodeB.point.y);
  }
  else {
    ctx.moveTo(nodeA.point.x, nodeA.point.y);
    ctx.lineTo(nodeB.point.x, nodeB.point.y);
  }
}

export const connectNodesWithStraightLine = (parent: CanvasNode, child: CanvasNode, ctx: CanvasRenderingContext2D) => {
  ctx.moveTo(parent.point.x, parent.point.y);
  ctx.lineTo(child.point.x, child.point.y);
}

