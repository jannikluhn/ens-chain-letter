import { ethers } from "ethers";
import { derived, readable } from "svelte/store";
import { chainID, provider } from "./ethereum.js";
import * as deployment from "./deployment.js";

export const networkSwitchRequired = derived(chainID, ($chainID) => {
  return $chainID !== deployment.chainId;
});

export const ensChainLetterContract = derived(
  [provider, networkSwitchRequired],
  ([$provider, $networkSwitchRequired]) => {
    if (!$provider || $networkSwitchRequired) {
      return null;
    }
    return new ethers.Contract(
      deployment.ensChainLetter.address,
      deployment.ensChainLetter.abi,
      $provider.getSigner()
    );
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
    // unsubscribe event listener from previous contract
    if (prevContract) {
      prevContract.off("LetterTransfer", transferListener);
    }
    prevContract = contract;
    isSet = false;

    // If the contract instance is null, we're not connected to the right network.
    if (!contract) {
      set(null);
      return;
    }

    // Subscribe to event so that we always have the latest values.
    contract.on("LetterTransfer", transferListener);

    // Check current values in contract, but ignore result if we already seen
    // an event that changed the value.
    Promise.all([contract.ownerOf(0), contract.numLetterTransfers()]).then(
      ([owner, numLetterTransfers]) => {
        if (!isSet) {
          set([owner, numLetterTransfers]);
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
      return null;
    } else {
      return $addressAndIndex[0];
    }
  }
);

export const currentOwnerIndex = derived(
  currentOwnerAddressAndIndex,
  ($addressAndIndex) => {
    if (!$addressAndIndex) {
      return null;
    } else {
      return $addressAndIndex[1];
    }
  }
);

export const currentOwnerENSName = derived(
  [provider, currentOwnerAddress],
  ([$provider, $currentOwnerAddress], set) => {
    if (!$provider) {
      set(null);
      return;
    }
    if (!$currentOwnerAddress) {
      set(null);
      return;
    }
    $provider.lookupAddress($currentOwnerAddress).then(set);
  }
);
