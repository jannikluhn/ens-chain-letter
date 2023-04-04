<script>
  import { ethers } from "ethers";
  import { onMount } from "svelte";
  import Footer from "../../../Footer.svelte";
  import Title from "../../../Title.svelte";
  import ColorfulText from "../../../ColorfulText.svelte";
  import Link from "../../../Link.svelte";
  import { provider, defaultEvmStores } from "svelte-ethers-store";
  import { ensChainLetterContract } from "../../../stores.js";
  import { env } from "$env/dynamic/public";
  import * as deployment from "../../../deployment.js";
  export let data;

  let ownerAddress;
  let owner;

  $: {
    if (!$ensChainLetterContract) {
      ownerAddress = undefined;
    } else {
      $ensChainLetterContract.ownerOf(data.stamp.tokenID).then((address) => {
        ownerAddress = address;
      });
    }
  }
  $: {
    if (!ownerAddress) {
      owner = undefined;
    } else if (!$provider) {
      owner = ownerAddress;
    } else {
      $provider.lookupAddress(ownerAddress).then((name) => {
        owner = name;
      });
    }
  }

  onMount(async () => {
    /* const accounts = await window.ethereum.request({ method: "eth_accounts" }); */
    /* if (accounts.length) { */
    /*   await defaultEvmStores.setProvider(); */
    /* } */
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
    owner = ownerAddress;
    const ownerENSName = await provider.lookupAddress(ownerAddress);
    owner = ownerENSName;
  });
</script>

<Title />
<h2 class="text-white text-6xl text-center mt-8 mb-16">
  <ColorfulText
    text="Stamp #{data.stamp.tokenID}"
    colorIndex={data.stamp.tokenID - 1}
    rainbow={false}
  />
</h2>

<div class="h-screen w-full">
  <img src={data.svgUrl} alt="Stamp" class="w-full h-full" />
</div>
<div class="container mx-auto">
  {#if owner}
    <p class="text-center text-2xl text-white">
      Owner: <Link
        underlineOnHover={false}
        href="https://etherscan.io/address/{owner}"
      >
        <ColorfulText
          text={owner}
          colorIndex={data.stamp.tokenID - 1}
          underlineOnHover={true}
        />
      </Link>
    </p>
  {/if}
</div>
<Footer />
