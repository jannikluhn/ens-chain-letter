<script>
  import { ethers } from "ethers";

  import Button from "./Button.svelte";
  import ColorfulText from "./ColorfulText.svelte";
  import Link from "./Link.svelte";
  import {
    ethereum,
    provider,
    accountAvailable,
    firstAccount,
  } from "./ethereum.js";
  import {
    networkSwitchRequired,
    ensChainLetterContract,
    currentOwnerAddress,
    currentOwnerENSName,
    currentOwnerIndex,
  } from "./stores.js";
  import * as deployment from "./deployment.js";

  let waitingForConnection = false;
  let waitingForNetworkSwitch = false;
  let waitingForTransfer = false;

  $: showWalletInstallNotice = !$ethereum;
  $: showConnectButton = !$accountAvailable || waitingForConnection;
  $: showSwitchNetworkButton =
    !showConnectButton && ($networkSwitchRequired || waitingForNetworkSwitch);
  $: isOwner =
    $firstAccount &&
    $currentOwnerAddress &&
    $firstAccount.toLowerCase() === $currentOwnerAddress.toLowerCase();

  $: currentOwnerText = $currentOwnerENSName || "...";
  $: currentOwnerIndexText = $currentOwnerIndex
    ? " (#" + $currentOwnerIndex.toString() + ")"
    : "";

  let receiverName = "";
  let errorMsg = "";

  async function connect() {
    waitingForConnection = true;
    try {
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
          $firstAccount,
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
</script>

<h2 class="text-white text-4xl text-center mb-4 mt-24">
  Current owner: <Link href="/stamp/{$currentOwnerIndex}"
    ><span class="font-semibold"
      ><ColorfulText
        text={currentOwnerText}
        rainbow={false}
        colorIndex={$currentOwnerIndex - 1}
        underlineOnHover={true}
      /></span
    ></Link
  >
  <ColorfulText
    text={currentOwnerIndexText}
    rainbow={false}
    colorIndex={$currentOwnerIndex - 1}
  />
</h2>

<div class="mx-auto text-center">
  {#if showWalletInstallNotice}
    <p class="text-white text-center my-4 max-w-lg mx-auto">No wallet found.</p>
  {:else if showConnectButton}
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
