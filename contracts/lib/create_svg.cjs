// import * as math from "mathjs";
// import chroma from "chroma-js";
const math = require("mathjs");
const chroma = require("chroma-js");

const r = 100;
const s = 4.44 * r;
const w = r / 60;
const wCircle = w * 3.33;
const colorScale = chroma
  .scale([
    "#9400D3",
    "#FF56E8",
    "#00FFE7",
    "#00FF00",
    "#FFFF00",
    "#FF7F00",
    "#FF0000",
    "#9400D3",
  ])
  .mode("lch");
const lightGray = chroma("#444444");
const darkGray = chroma("#222222");

function computePaths(angles) {
  const arcs = computeArcs(angles);
  const controlPoints = computeControlPointsForArcs(arcs);
  return arcs.map((arc, i) => computeBezierPath(arc, controlPoints[i]));
}

function computeBezierPath(points, controlPoints) {
  let commands = [];
  commands.push(command("M", [points[0]]));
  for (let i = 1; i < points.length; i++) {
    const c0 = controlPoints[i - 1][1];
    const c1 = controlPoints[i][0];
    commands.push(command("C", [c0, c1, points[i]]));
  }
  return commands.join("");
}

function command(c, ps) {
  return [
    c,
    ps
      .map(tr)
      .map((p) => p.join(" "))
      .join(" "),
  ].join(" ");
}

function computeControlPointsForArcs(arcs) {
  let allControlPoints = [];
  if (arcs.length === 0) {
    return allControlPoints;
  }

  for (let i = 0; i < arcs.length; i++) {
    let start, end;
    if (i === 0) {
      start = arcs[0][0];
    } else {
      start = arcs[i - 1][arcs[i - 1].length - 1];
    }
    if (i === arcs.length - 1) {
      end = arcs[i][arcs[i].length - 1];
    } else {
      end = arcs[i + 1][0];
    }
    let points = [];
    points.push(start, ...arcs[i], end);

    let controlPoints = computeControlPoints(points);
    controlPoints = controlPoints.slice(1, -1);
    allControlPoints.push(controlPoints);
  }
  return allControlPoints;
}

function computeControlPoints(points) {
  let controlPoints = [];
  controlPoints.push([points[0], points[0]]);
  for (let i = 1; i < points.length - 1; i++) {
    const middle = points[i];
    const prev = points[i - 1];
    const next = points[i + 1];
    const tangent = normalize(math.subtract(next, prev));
    const dPrev = math.norm(math.subtract(middle, prev));
    const dNext = math.norm(math.subtract(middle, next));
    const cPrev = math.subtract(middle, math.multiply(tangent, dPrev / 3));
    const cNext = math.add(middle, math.multiply(tangent, dNext / 3));
    controlPoints.push([cPrev, cNext]);
  }
  controlPoints.push([points[points.length - 1], points[points.length - 1]]);
  return controlPoints;
}

function computeArcs(angles) {
  let arcs = [];
  for (let i = 0; i < angles.length - 1; i++) {
    const arc = computeArc(angles[i], angles[i + 1], i % 2 === 0);
    arcs.push(arc);
  }
  return arcs;
}

function computeArc(a0, a1, isOuter) {
  const n = 20;
  const da = subtractAngles(a1, a0);
  const r0 = (math.abs(da) / (2 * math.pi)) * (isOuter ? 1 : -1);
  const k = 1 / r0;

  const thetas = Array(n)
    .fill()
    .map((_, i) => (i * da) / (n - 1));
  return thetas
    .map((theta) => epicycloid(r0, k, theta))
    .map((p) => math.rotate(p, a0));
}

function epicycloid(r0, k, theta) {
  const kp1 = k + 1;
  return [
    r0 * kp1 * math.cos(theta) - r0 * math.cos(kp1 * theta),
    r0 * kp1 * math.sin(theta) - r0 * math.sin(kp1 * theta),
  ];
}

function subtractAngles(a0, a1) {
  return math.atan2(math.sin(a0 - a1), math.cos(a0 - a1));
}

function normalize(p) {
  return math.divide(p, math.norm(p));
}

function radToDeg(a) {
  return (a / math.pi) * 180;
}

function degToRad(a) {
  return (a / 180) * math.pi;
}

function tr1d(x) {
  return x * r + s / 2;
}

function tr(p) {
  return math.add(math.multiply(p, r), [s / 2, s / 2]);
}

function getBaseColor(i) {
  return colorScale(((i * Math.PI) / 30) % 1);
}

function getStampColor(i, n) {
  const baseColor = getBaseColor(i);
  const numFull = 3;
  const numGrayish = 9;
  const numDarking = 50;
  const j = n - 1 - i;
  if (j < numFull) {
    return baseColor;
  } else if (j < numFull + numGrayish) {
    const k = j - numFull;
    const x = k / numGrayish;
    const scale = chroma.scale([baseColor, lightGray]);
    return scale(x);
  } else {
    const k = j - numFull - numGrayish;
    const x = k / numDarking;
    const scale = chroma.scale([lightGray, darkGray]);
    return scale(x);
  }
}

function createLetterSVG(angles) {
  const colors = angles.map((_, i) => getBaseColor(i));
  return createSVGWithColors(angles, colors);
}

function createStampSVG(angles) {
  const colors = angles.map((_, i) => getStampColor(i, angles.length));
  return createSVGWithColors(angles, colors);
}

function createSVGWithColors(angles, colors) {
  const paths = computePaths(angles);

  let svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${s} ${s}"
  height="100%"
  width="100%"
  preserveAspectRatio="xMidYMid meet"
  viewport-fill="black"
>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${w}" result="blur1" />
    <feGaussianBlur in="SourceGraphic" stdDeviation="${2 * w}" result="blur2" />
    <feMerge>
      <feMergeNode in="blur1" />
      <feMergeNode in="blur2" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>`;

  svg += `  <rect width="100%" height="100%" fill="black"/>
`;

  svg += `  <g>
`;
  for (const [i, path] of paths.entries()) {
    svg += `    <path
      d="${path}"
      stroke="${colors[i]}"
      stroke-width="${w}"
      fill="none"
      filter="url(#glow)"
    />
`;
  }
  svg += `  </g>
`;

  svg += ` <circle
    cx="${tr1d(0)}"
    cy="${tr1d(0)}"
    r="${r}"
    fill="none"
    stroke="white"
    opacity="0.95"
    stroke-width="${wCircle}"
  />
</svg>`;

  return svg;
}

exports.createLetterSVG = createLetterSVG;
exports.createStampSVG = createStampSVG;
