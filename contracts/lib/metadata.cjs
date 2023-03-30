const fs = require("fs/promises");
const { createStampSVG, createLetterSVG } = require("../lib/create_svg.cjs");

async function updateMetadata(events) {
  await updateLetterMetadata(events);
  for (let i = 1; i <= events.length; i++) {
    await updateStampMetadata(events, i);
  }
  await updateSummary(events);
}

async function updateLetterMetadata(events) {
  const metadata = {
    name: "ENS Chain Letter",
    description:
      "A unique token being passed around between ENS community members",
    image: "https://ens-chain-letter.xyz/nft/0.svg",
  };
  const angles = await getAnglesFromEvents(events);
  const svg = createLetterSVG(angles);
  await writeMetadata(0, metadata, svg);
}

async function updateStampMetadata(events, i) {
  const metadata = {
    name: "ENS Chain Letter Stamp",
    description: "A small prize awarded for passing on the ENS Chain Letter",
    image: `https://ens-chain-letter.xyz/nft/${i}.svg`,
  };
  const angles = await getAnglesFromEvents(events.slice(0, i));
  const svg = createStampSVG(angles);
  await writeMetadata(i, metadata, svg);
}

async function writeMetadata(tokenID, metadata, svg) {
  const metadataPath = process.env.METADATA_DIR + "/" + tokenID.toString();
  const svgPath = process.env.METADATA_DIR + "/" + tokenID.toString() + ".svg";
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  await fs.writeFile(svgPath, svg);
}

async function getAnglesFromEvents(events) {
  const deployment = await hre.deployments.get("ENSChainLetter");
  const originalENSNode = deployment.args[0];
  let angles = [getAngleFromENSNode(originalENSNode)];
  for (const event of events) {
    const ensNode = event.topics[3];
    angles.push(getAngleFromENSNode(ensNode));
  }
  return angles;
}

function getAngleFromENSNode(ensNode) {
  let angle = 0;
  const bs = ethers.utils.arrayify(ensNode);
  for (let d = 0; d < bs.length; d++) {
    const b = bs[d];
    angle += (2 * Math.PI * b) / Math.pow(256, d + 1);
  }
  return angle;
}

async function updateSummary(events) {
  const summary = {
    stamps: events.map((event, i) => {
      return {
        ensNode: event.topics[3],
        tokenID: i + 1,
      };
    }),
  };
  const path = process.env.METADATA_DIR + "/summary.json";
  await fs.writeFile(path, JSON.stringify(summary, null, 2));
}

exports.updateMetadata = updateMetadata;
