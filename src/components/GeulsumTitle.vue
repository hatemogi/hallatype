<template>
  <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="글숨"
    preserveAspectRatio="xMidYMid meet">
    <defs>
      <filter :id="필터ID" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 0 1"
          result="연필명암" />
        <feComposite in="연필명암" in2="SourceAlpha" operator="in" result="연필질감" />
        <feFlood flood-color="currentColor" result="테마글자색" />
        <feComposite in="테마글자색" in2="연필질감" operator="in" />
      </filter>
      <clipPath v-if="gapReduction" :id="왼쪽영역ID" clipPathUnits="userSpaceOnUse">
        <rect x="0" y="0" :width="width / 2" :height="height" />
      </clipPath>
      <clipPath v-if="gapReduction" :id="오른쪽영역ID" clipPathUnits="userSpaceOnUse">
        <rect :x="width / 2" y="0" :width="width / 2" :height="height" />
      </clipPath>
    </defs>
    <image v-if="!gapReduction" :href="src" :width="width" :height="height" :filter="`url(#${필터ID})`" />
    <template v-else>
      <g :transform="`translate(${gapReduction / 2} 0)`" :clip-path="`url(#${왼쪽영역ID})`">
        <image :href="src" :width="width" :height="height" :filter="`url(#${필터ID})`" />
      </g>
      <g :transform="`translate(${-gapReduction / 2} 0)`" :clip-path="`url(#${오른쪽영역ID})`">
        <image :href="src" :width="width" :height="height" :filter="`url(#${필터ID})`" />
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{ src: string; width: number; height: number; gapReduction?: number }>();
const 필터ID = `${useId()}-연필색`;
const 왼쪽영역ID = `${useId()}-글`;
const 오른쪽영역ID = `${useId()}-숨`;
</script>
