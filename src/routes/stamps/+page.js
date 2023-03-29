import { env } from "$env/dynamic/public";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  const summaryResponse = await fetch(
    `${env.PUBLIC_METADATA_URL}/summary.json`
  );
  const summary = await summaryResponse.json();

  let stamps = [];
  for (const stamp of summary.stamps) {
    stamps.push({
      tokenID: stamp.tokenID,
      svgUrl: `${env.PUBLIC_METADATA_URL}/${stamp.tokenID}.svg`,
    });
  }

  return {
    stamps: stamps,
  };
}
