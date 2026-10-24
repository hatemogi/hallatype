<template>
  <svg class="글숨문양" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="30" />
    <path d="M12 28c7-7 14-7 21 0s14 7 21 0" />
    <path d="M17 39c5-5 10-5 15 0s10 5 15 0" />
  </svg>
</template>

<style scoped>
.글숨문양 { display: block; width: 31px; height: 31px; flex: none; }
.글숨문양 circle { fill: var(--강조); }
.글숨문양 path { fill: none; stroke: var(--역글); stroke-linecap: round; }
.글숨문양 path:nth-of-type(1) { stroke-width: 5; }
.글숨문양 path:nth-of-type(2) { stroke-width: 4; opacity: .7; }
</style>
