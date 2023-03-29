<script>
  export let href;
  export let underlineOnHover = false;
</script>

<a
  {href}
  class="{underlineOnHover ? 'hover:underline' : ''} cursor-pointer text-white"
>
  <slot />
</a>
