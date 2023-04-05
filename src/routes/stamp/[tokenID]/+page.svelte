<script>
  import Footer from "../../../Footer.svelte";
  import Title from "../../../Title.svelte";
  import ColorfulText from "../../../ColorfulText.svelte";
  import Link from "../../../Link.svelte";
  import { provider } from "../../../ethereum.js";
  import { ensChainLetterContract } from "../../../stores.js";

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
      owner = null;
    } else {
      $provider.lookupAddress(ownerAddress).then((name) => {
        owner = name;
      });
    }
  }
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
