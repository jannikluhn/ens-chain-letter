import { derived, readable } from "svelte/store";
import {
  connected,
  chainId,
  signerAddress,
  provider,
  contracts,
  defaultEvmStores,
} from "svelte-ethers-store";
import * as deployment from "./deployment.js";

defaultEvmStores.attachContract(
  "ensChainLetter",
  deployment.ensChainLetter.address,
  deployment.ensChainLetter.abi
);

export const connectionRequired = derived(
  [connected, signerAddress],
  ([$connected, $signerAddress]) => {
    return !$connected || !$signerAddress;
  }
);

export const networkSwitchRequired = derived(chainId, ($chainId) => {
  return $chainId !== deployment.chainId;
});

export const ensChainLetterContract = derived(
  [contracts, networkSwitchRequired],
  ([$contracts, $networkSwitchRequired]) => {
    if (!$networkSwitchRequired) {
      return $contracts.ensChainLetter;
    } else {
      return undefined;
    }
  }
);

export const currentOwnerAddressAndIndex = readable(undefined, (set) => {
  let isSet = false;
  function transferListener(_from, to, index, _ensNode) {
    set([to, index]);
    isSet = true;
  }

  let prevContract;
  ensChainLetterContract.subscribe((contract) => {
    if (prevContract) {
      prevContract.off("LetterTransfer", transferListener);
    }
    prevContract = contract;

    if (!contract) {
      set(undefined);
      return;
    }

    contract.on("LetterTransfer", transferListener);
    Promise.all([contract.ownerOf(0), contract.numLetterTransfers()]).then(
      ([owner, numLetterTransfers]) => {
        if (!isSet) {
          set([owner, numLetterTransfers - 1]);
          isSet = true;
        }
      }
    );
  });

  return () => {
    if (prevContract) {
      prevContract.off(transferListener);
    }
  };
});

export const currentOwnerAddress = derived(
  currentOwnerAddressAndIndex,
  ($addressAndIndex) => {
    if (!$addressAndIndex) {
      return undefined;
    } else {
      return $addressAndIndex[0];
    }
  }
);

export const currentOwnerIndex = derived(
  currentOwnerAddressAndIndex,
  ($addressAndIndex) => {
    if (!$addressAndIndex) {
      return undefined;
    } else {
      return $addressAndIndex[1];
    }
  }
);

export const currentOwnerENSName = derived(
  [provider, currentOwnerAddress],
  ([$provider, $currentOwnerAddress], set) => {
    if (!$provider) {
      set(undefined);
      return;
    }
    if (!$currentOwnerAddress) {
      set(undefined);
      return;
    }
    $provider.lookupAddress($currentOwnerAddress).then(set);
  }
);
