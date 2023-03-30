import chroma from "chroma-js";

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

export function getBaseColor(i) {
  return colorScale(((i * Math.PI) / 30) % 1);
}
