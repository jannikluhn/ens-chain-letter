const { createLetterSVG, createStampSVG } = require("../lib/create_svg.cjs");
const fs = require("fs/promises");

async function main() {
  let angles = [];
  for (let i = 0; i < 30; i++) {
    angles.push(Math.random() * 2 * Math.PI);
  }
  svg = createStampSVG(angles);
  await fs.writeFile("test.svg", svg);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
