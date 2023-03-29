<script>
  import { env } from "$env/dynamic/public";
  import HolderSection from "../HolderSection.svelte";
  import DownArrow from "../DownArrow.svelte";
  import ColorfulText from "../ColorfulText.svelte";
  import Link from "../Link.svelte";
  import Title from "../Title.svelte";
  import Footer from "../Footer.svelte";
</script>

<div class="w-full h-screen">
  <div class="h-screen mx-auto relative">
    <div class="absolute w-full h-full flex flex-col justify-end items-center">
      <div class="w-8 mb-2">
        <DownArrow />
      </div>
    </div>
    <img
      class="w-full h-full"
      src={env.PUBLIC_METADATA_URL + "/0.svg"}
      alt="ENS Chain Letter NFT"
    />
  </div>
  <div class="container mx-auto mt-16">
    <div class="mx-4">
      <Title />
      <div class="max-w-lg mx-auto text-white text-justify indent-4 mt-16">
        <p>
          The ENS Chain Letter is a unique NFT that is passed around between ENS
          name holders. It is visualized above: Each ENS name has a spot on the
          white circle and the colorful arcs represent the transfers between
          them.
        </p>
        <p class="mt-3">
          The goal is to keep the streak going for as long as possible and make
          the picture look like a big ball of wool. If someone gives the token
          to you, it's on you to send it forward. Choose the next receiver
          wisely, we depend on you!
        </p>
        <p class="mt-3">
          As a small incentive and token of appreciation for participating in
          this experiment, sending the letter automatically mints a "stamp": A
          custom NFT for the sender to keep.
        </p>
      </div>
      <HolderSection />
      <h1
        class="text-white text-4xl text-center mt-24 mb-4"
        style="text-shadow: currentColor 1px 0 10px"
      >
        <Link href="/stamps">
          <ColorfulText
            text="Visit Stamp Collection"
            rainbow={true}
            underlineOnHover={true}
          />
        </Link>
      </h1>
    </div>
    <Footer />
  </div>
</div>
