import * as chainIdFile from "./deployment/.chainId?raw";
import * as ensChainLetter from "./deployment/ENSChainLetter.json";

let chainId = Number(chainIdFile.default);

export { chainId, ensChainLetter };
