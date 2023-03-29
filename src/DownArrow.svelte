<script>
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  let visible = false;
  onMount(() => {
    visible = true;
  });

  function handleScroll() {
    visible = false;
  }

  function handleClick(e) {
    const window = e.view;
    console.log(
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
    );
  }
</script>

{#if visible}
  <svg
    fill="#FFFFFF"
    height="100%"
    width="100%"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 90 32"
    xml:space="preserve"
    in:fade={{ duration: 1000, delay: 8000 }}
    out:fade={{ duration: 500, delay: 0 }}
    class="cursor-pointer"
    on:click={handleClick}
  >
    <path
      d="m 5,5 40,23 40,-23"
      style="fill:none;fill-opacity:1;stroke:#FFFFFF;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
    />
  </svg>
{/if}

<svelte:window on:scroll={handleScroll} />
