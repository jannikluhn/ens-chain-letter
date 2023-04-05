<script>
  import { onMount } from "svelte";
  import "../app.css";
  import { setup } from "../ethereum.js";

  onMount(async () => {
    await setup();
  });
</script>

<slot />
