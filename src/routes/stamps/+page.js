import { PUBLIC_METADATA_URL } from "$env/static/public";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  const summaryResponse = await fetch(`${PUBLIC_METADATA_URL}/summary.json`);
  const summary = await summaryResponse.json();

  let stamps = [];
  for (const stamp of summary.stamps) {
    stamps.push({
      tokenID: stamp.tokenID,
      svgUrl: `${PUBLIC_METADATA_URL}/${stamp.tokenID}.svg`,
    });
  }

  return {
    stamps: stamps,
  };
}
