<script>
  import { getBaseColor } from "./colors.js";

  export let text;
  export let underlineOnHover = false;
  export let colorIndex = Math.floor(Math.random() * 100);
  export let rainbow = true;

  $: colorfulText = makeColorful(text, colorIndex, rainbow);

  function makeColorful(text, colorIndex, rainbow) {
    const words = text.split(" ");
    const colors = words.map((_word, wordIndex) => {
      const i = rainbow ? colorIndex + wordIndex : colorIndex;
      return getBaseColor(i);
    });

    const coloredWords = words
      .map((word, i) => {
        return `<span style="color: ${colors[i]};">${word}</span>`;
      })
      .join(" ");

    const underlineColor = colors[Math.floor(colors.length / 2)];
    const classes = underlineOnHover ? "hover:underline" : "";
    const underlined = `<span class="${classes}" style="text-decoration-color: ${underlineColor};">${coloredWords}</span>`;
    return underlined;
  }
</script>

{@html colorfulText}
