<script>
  import Link from "./Link.svelte";
  import ColorfulText from "./ColorfulText.svelte";
</script>

<h1 class="text-white text-8xl text-center mt-16 mb-8">
  <Link href="/">
    <ColorfulText text="ENS Chain Letter" underlineOnHover={true} />
  </Link>
</h1>

<style>
  h1 {
    text-shadow: currentColor 1px 0 10px;
  }
</style>
