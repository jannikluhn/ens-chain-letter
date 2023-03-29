import { error } from "@sveltejs/kit";
import { PUBLIC_METADATA_URL } from "$env/static/public";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
  const i = parseInt(params.tokenID);
  if (isNaN(i) || i < 0) {
    throw error(400, "Invalid tokenID");
  }

  const summaryResponse = await fetch(`${PUBLIC_METADATA_URL}/summary.json`);
  const summary = await summaryResponse.json();

  let stamp;
  for (const s of summary.stamps) {
    if (s.tokenID === i) {
      stamp = s;
      break;
    }
  }
  if (!stamp) {
    throw error(404, "Stamp not found");
  }

  return {
    stamp: stamp,
    svgUrl: `${PUBLIC_METADATA_URL}/${stamp.tokenID}.svg`,
  };
}
