<script>
  import Footer from "../../Footer.svelte";
  import Title from "../../Title.svelte";
  import Link from "../../Link.svelte";
  import ColorfulText from "../../ColorfulText.svelte";

  export let data;
</script>

<div class="flex flex-col h-screen justify-between">
  <div>
    <Title />
    <h2 class="text-white text-6xl text-center mt-8 mb-16">Stamp Collection</h2>
    <div class="container mx-auto grid grid-cols-2 gap-4 md:grid-cols-4 mb-16">
      {#each data.stamps.reverse() as stamp}
        <div class="h-fit">
          <Link href="/stamp/{stamp.tokenID}">
            <img src={stamp.svgUrl} alt="Stamp #{stamp.tokenID}" />
            <h2 class="text-white text-center text-2xl w-full mx-auto">
              <ColorfulText
                text="#{stamp.tokenID}"
                colorIndex={stamp.tokenID - 1}
                rainbow={false}
                underlineOnHover={true}
              />
            </h2>
          </Link>
        </div>
      {/each}
    </div>
  </div>
  <Footer />
</div>
