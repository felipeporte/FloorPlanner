let segments = [];

export function addSegment(from, to) {
  segments.push({ from: from.clone(), to: to.clone() });
}

export function getSegments() {
  return segments;
}

export function clearSegments() {
  segments = [];
}