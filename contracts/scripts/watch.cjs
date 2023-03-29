require("dotenv").config();

const hre = require("hardhat");
const fastq = require("fastq");
const fs = require("fs/promises");

const { updateMetadata } = require("../lib/metadata.cjs");

const maxBlockRange = 1000;
const reorgDelay = 10;

let allEvents = [];
let syncedUntil = null;

async function main() {
  const deployment = await hre.deployments.get("ENSChainLetter");
  const deployBlock = deployment.receipt.blockNumber;
  const contract = new hre.ethers.Contract(
    deployment.address,
    deployment.abi,
    hre.ethers.provider
  );

  let file;
  try {
    file = await fs.readFile(process.env.EVENTS_FILE_PATH);
  } catch (e) {
    console.log("no events file found, syncing from scratch");
  }
  if (file !== undefined) {
    const data = JSON.parse(file);
    syncedUntil = data.syncedUntil;
    allEvents = data.events;
    console.log("continuing sync");
  }

  await syncEvents(contract, deployBlock);
}

async function syncEvents(contract, deployBlock) {
  const historicEventQueue = fastq.promise(processQueueItem, 1);
  const liveEventQueue = fastq.promise(processQueueItem, 1);
  liveEventQueue.pause();

  historicEventQueue.error(handleError);
  liveEventQueue.error(handleError);

  const currentBlock = await hre.ethers.provider.getBlockNumber();
  hre.ethers.provider.on(contract.filters.LetterTransfer(), async (e) => {
    if (e.blockNumber > currentBlock) {
      liveEventQueue.push(e);
    }
  });
  hre.ethers.provider.on("block", async (blockNumber) => {
    liveEventQueue.push(blockNumber);
  });

  const startBlock = Math.max(deployBlock, syncedUntil || 0);
  console.log(
    "fetching historic events between",
    startBlock,
    "and",
    currentBlock
  );
  for (
    let fromBlock = startBlock;
    fromBlock <= currentBlock;
    fromBlock += maxBlockRange
  ) {
    const toBlock = Math.min(fromBlock + maxBlockRange, currentBlock);
    const events = await contract.queryFilter(
      "LetterTransfer",
      fromBlock,
      toBlock
    );
    for (const e of events) {
      const prevEvent = allEvents ? allEvents[allEvents.length - 1] : null;
      if (!prevEvent || isLaterEvent(e, prevEvent) || e.removed) {
        historicEventQueue.push(e);
      }
    }
  }

  console.log("historic events synced, now watching for live events");
  liveEventQueue.resume();

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    console.log("watching events...");
  }
}

function isLaterEvent(e1, e2) {
  return (
    e1.blockNumber > e2.blockNumber ||
    (e1.blockNumber === e2.blockNumber && e1.logIndex > e2.logIndex)
  );
}

async function processQueueItem(i) {
  if (typeof i === "number") {
    await processBlockNumber(i);
  } else {
    await processEvent(i);
  }

  const file = {
    events: allEvents,
    syncedUntil: syncedUntil,
  };
  await fs.writeFile(
    process.env.EVENTS_FILE_PATH,
    JSON.stringify(file, null, 2)
  );
}

async function processBlockNumber(blockNumber) {
  syncedUntil = blockNumber - reorgDelay;
}

async function processEvent(e) {
  if (!e.removed) {
    console.log(
      "received transfer event in block",
      e.blockNumber,
      "in tx",
      e.transactionHash
    );
    allEvents.push(e);
    await updateMetadata(allEvents);
  } else {
    console.log("received event removal notice", e);
    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      if (event.blockHash == e.blockHash && event.logIndex == e.logIndex) {
        console.log("removing event", event);
        allEvents.splice(i, 1);
      }
    }
  }
}

function handleError(e) {
  if (e) {
    console.error(e);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
