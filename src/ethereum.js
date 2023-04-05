import { ethers } from "ethers";
import { writable, derived } from "svelte/store";
import { env } from "$env/dynamic/public";
import * as deployment from "./deployment.js";

const fallbackProvider = new ethers.providers.JsonRpcProvider(
  env.PUBLIC_RPC_URL,
  deployment.chainId
);

export const ethereum = writable(null);

export const isUsingFallbackProvider = derived(ethereum, ($ethereum) => {
  return $ethereum === null;
});

export const provider = derived(ethereum, ($ethereum) => {
  if ($ethereum) {
    return new ethers.providers.Web3Provider($ethereum, deployment.chainId);
  } else {
    return fallbackProvider;
  }
});

let connectedSetByEvent = false;
export const connected = writable(false);
let chainIDSetByEvent = false;
const chainIDHex = writable(null);
let accountsSetByEvent = false;
export const accounts = writable([]);

export const chainID = derived(chainIDHex, ($chainIDHex) => {
  if ($chainIDHex) {
    return parseInt($chainIDHex, 16);
  } else {
    return null;
  }
});

export const accountAvailable = derived(accounts, ($accounts) => {
  return $accounts.length > 0;
});

export const firstAccount = derived(accounts, ($accounts) => {
  if ($accounts.length > 0) {
    return $accounts[0];
  } else {
    return null;
  }
});

export async function setup() {
  registerEventListeners();
  if (window.ethereum) {
    ethereum.update((_) => window.ethereum);

    const queriedConnection = window.ethereum.isConnected();
    connected.update((v) => (connectedSetByEvent ? v : queriedConnection));

    const queriedChainID = await window.ethereum.request({
      method: "eth_chainId",
    });
    chainIDHex.update((v) => (chainIDSetByEvent ? v : queriedChainID));

    const queriedAccounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    accounts.update((v) => (accountsSetByEvent ? v : queriedAccounts));
  } else {
    const network = await fallbackProvider.getNetwork();
    connected.update((_) => true);
    chainIDHex.update((_) => ethers.utils.hexValue(network.chainId));
  }
}

let eventListenersRegistered = false;

function registerEventListeners() {
  if (!window) {
    throw new Error("window is not available");
  }
  if (!window.ethereum) {
    return;
  }

  window.ethereum.on("connect", handleConnect);
  window.ethereum.on("disconnect", handleDisconnect);
  window.ethereum.on("chainChanged", handleChainChanged);
  window.ethereum.on("accountsChanged", handleAccountsChanged);

  eventListenersRegistered = true;
}

function deregisterEventListeners() {
  if (!window) {
    throw new Error("window is not available");
  }
  if (!eventListenersRegistered) {
    return;
  }

  if (!window.ethereum) {
    throw new Error(
      "failed to deregister event listeners as window.ethereum is unavailable"
    );
  }

  window.ethereum.removeListener("connect", handleConnect);
  window.ethereum.removeListener("disconnect", handleDisconnect);
  window.ethereum.removeListener("chainChanged", handleChainChanged);
  window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
}

function handleConnect(connectInfo) {
  connected.update((_) => true);
  chainIDHex.update((_) => connectInfo.chainId);
  connectedSetByEvent = true;
  chainIDSetByEvent = true;
}

function handleDisconnect() {
  connected.update((_) => false);
  chainIDHex.update((_) => null);
  accounts.update((_) => []);

  connectedSetByEvent = true;
  chainIDSetByEvent = true;
  accountsSetByEvent = true;
}

function handleChainChanged(newChainID) {
  chainIDHex.update((_) => newChainID);
  chainIDSetByEvent = true;
}

function handleAccountsChanged(newAccounts) {
  accounts.update((_) => newAccounts);
  accountsSetByEvent = true;
}
