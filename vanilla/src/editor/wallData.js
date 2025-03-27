let wallSegments = [];

export function addWallSegment(from, to) {
  wallSegments.push({ from: from.clone(), to: to.clone() });
}

export function getWallSegments() {
  return wallSegments;
}

export function clearWallSegments() {
  wallSegments = [];
}