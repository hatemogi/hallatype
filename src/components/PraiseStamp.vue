<template>
  <span class="칭찬도장" :class="{ 작게: compact }" role="img"
    :aria-label="`${grade === '참잘했어요' ? '정타율 100%' : '정타율 98% 이상'}, ${grade} 도장`">
    <span v-if="grade === '참잘했어요'" aria-hidden="true">참<br>잘했어요</span>
    <span v-else aria-hidden="true">잘했<br>어요</span>
  </span>
</template>

<script setup lang="ts">
import type { 칭찬도장종류 } from '@/practice-progress';

defineProps<{ grade: 칭찬도장종류; compact?: boolean }>();
</script>

<style scoped>
.칭찬도장 {
  position: relative;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 54px;
  height: 54px;
  border: 2px solid var(--강조);
  border-radius: 50%;
  color: var(--글);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: -.08em;
  line-height: 1.2;
  text-align: center;
  transform: rotate(-9deg);
  white-space: nowrap;
}
.칭찬도장::before { position: absolute; inset: 3px; border: 1px solid var(--강조); border-radius: 50%; content: ''; }
.칭찬도장.작게 { width: 38px; height: 38px; font-size: 8px; }
.칭찬도장.작게::before { inset: 2px; }
</style>
