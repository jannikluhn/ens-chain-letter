<script>
  import { onMount } from "svelte";
  import { ethers } from "ethers";

  import {
    provider,
    signerAddress,
    defaultEvmStores,
  } from "svelte-ethers-store";
  import Button from "./Button.svelte";
  import ColorfulText from "./ColorfulText.svelte";
  import Link from "./Link.svelte";
  import {
    connectionRequired,
    networkSwitchRequired,
    ensChainLetterContract,
    currentOwnerAddress,
    currentOwnerENSName,
    currentOwnerIndex,
  } from "./stores.js";
  import * as deployment from "./deployment.js";
  import { env } from "$env/dynamic/public";

  let waitingForConnection = false;
  let waitingForNetworkSwitch = false;
  let waitingForTransfer = false;

  let currentOwnerENSNameAlt;
  let currentOwnerIndexAlt;
  $: currentOwnerENSNameSafe = $currentOwnerENSName || currentOwnerENSNameAlt;
  $: currentOwnerIndexSafe = $currentOwnerIndex || currentOwnerIndexAlt;

  $: showConnectButton = $connectionRequired || waitingForConnection;
  $: showSwitchNetworkButton =
    !showConnectButton && ($networkSwitchRequired || waitingForNetworkSwitch);
  $: isOwner =
    $signerAddress &&
    $currentOwnerAddress &&
    $signerAddress.toLowerCase() === $currentOwnerAddress.toLowerCase();

  $: currentOwnerText = currentOwnerENSNameSafe || "...";
  $: currentOwnerIndexText = currentOwnerIndexSafe
    ? " (#" + currentOwnerIndexSafe.toString() + ")"
    : "";

  let receiverName = "";
  let errorMsg = "";

  async function connect() {
    waitingForConnection = true;
    try {
      await defaultEvmStores.setProvider();
      await $provider.send("eth_requestAccounts", []);
      await switchNetwork();
    } finally {
      waitingForConnection = false;
    }
  }

  async function switchNetwork() {
    waitingForNetworkSwitch = true;
    try {
      await $provider.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexValue(deployment.chainId) },
      ]);
    } finally {
      waitingForNetworkSwitch = false;
    }
  }

  async function transfer() {
    errorMsg = "";
    waitingForTransfer = true;
    try {
      const parts = receiverName.split(".");
      if (
        parts.length === 1 ||
        parts[parts.length - 1].toLowerCase() !== "eth"
      ) {
        errorMsg = "Only .eth names are supported";
        return;
      }

      let address;
      try {
        address = await $provider.resolveName(receiverName);
      } catch (e) {
        errorMsg = "Failed to resolve ENS name.";
        console.error(e);
        return;
      }
      if (!address) {
        errorMsg = "ENS name '" + receiverName + "' does not exist";
        return;
      }

      const hash = ethers.utils.namehash(receiverName);
      try {
        if (await $ensChainLetterContract.previousLetterOwners(hash)) {
          errorMsg =
            "The given receiver has already owned the NFT in the past, please choose another one.";
          return;
        }
      } catch (e) {
        errorMsg = "Failed to check if receiver already owned token.";
        console.error(e);
        return;
      }

      try {
        const tx = await $ensChainLetterContract.transferLetter(
          $signerAddress,
          hash,
          "0x"
        );
        await tx.wait();
      } catch (e) {
        errorMsg = "Failed to send transaction.";
        console.error(e);
        return;
      }
    } finally {
      waitingForTransfer = false;
    }
  }

  onMount(async () => {
    let provider;
    if (!window.ethereum) {
      provider = new ethers.providers.JsonRpcProvider(
        env.PUBLIC_RPC_URL,
        deployment.chainId
      );
    } else {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        provider = new ethers.providers.Web3Provider(
          window.ethereum,
          deployment.chainId
        );
      } else {
        await defaultEvmStores.setProvider();
        return;
      }
    }
    const contract = new ethers.Contract(
      deployment.ensChainLetter.address,
      deployment.ensChainLetter.abi,
      provider
    );
    const ownerAddress = await contract.ownerOf(0);
    currentOwnerENSNameAlt = ownerAddress;
    currentOwnerIndexAlt = await contract.numLetterTransfers();
    const ownerENSName = await provider.lookupAddress(ownerAddress);
    currentOwnerENSNameAlt = ownerENSName;
  });
</script>

<h2 class="text-white text-4xl text-center mb-4 mt-24">
  Current owner: <Link href="/stamp/{currentOwnerIndexSafe}"
    ><span class="font-semibold"
      ><ColorfulText
        text={currentOwnerText}
        rainbow={false}
        colorIndex={currentOwnerIndexSafe - 1}
        underlineOnHover={true}
      /></span
    ></Link
  >
  <ColorfulText
    text={currentOwnerIndexText}
    rainbow={false}
    colorIndex={currentOwnerIndexSafe - 1}
  />
</h2>

<div class="mx-auto text-center">
  {#if showConnectButton}
    <Button on:click={connect} waiting={waitingForConnection}>
      Connect wallet
    </Button>
  {:else if showSwitchNetworkButton}
    <Button on:click={switchNetwork} waiting={waitingForNetworkSwitch}>
      Switch Network
    </Button>
  {:else if isOwner}
    <p class="text-white text-center my-4 max-w-lg mx-auto">
      That's you! Please transfer the token to a friend.
    </p>
    <div class="flex flex-row max-w-md mx-auto items-center">
      <input
        type="text"
        class="grow rounded-md p-2 border focus:outline outline-1 outline-white outline-offset-2 h-fit"
        placeholder="receiver.eth"
        bind:value={receiverName}
        on:keypress={async (e) => {
          if (e.key === "Enter") {
            await transfer();
          }
        }}
      />
      <Button on:click={transfer} waiting={waitingForTransfer}>Transfer</Button
      >>
    </div>
    {#if errorMsg}
      <p class="text-white text-center my-4 max-w-lg mx-auto">
        {errorMsg}
      </p>
    {/if}
  {:else}
    <p class="text-white text-center max-w-lg mx-auto">
      If that's you, select the corresponding account in your wallet.
    </p>
  {/if}
</div>
