<template>
  <span class="칭찬도장" :class="{ 작게: compact, 크게: large }" role="img"
    :aria-label="grade === 'PB' ? '개인 최고 기록 도장' : grade === '완료' ? '필사 완료 도장' : `${grade === '참잘했어요' ? '정타율 100%' : '정타율 98% 이상'}, ${grade} 도장`">
    <span v-if="grade === '참잘했어요'" aria-hidden="true">참<br>잘했어요</span>
    <span v-else-if="grade === '잘했어요'" aria-hidden="true">잘했<br>어요</span>
    <span v-else-if="grade === 'PB'" aria-hidden="true">최고<br>기록</span>
    <span v-else aria-hidden="true">완료</span>
  </span>
</template>

<script setup lang="ts">
import type { 칭찬도장종류 } from '@/practice-progress';

defineProps<{ grade: 칭찬도장종류 | 'PB'; compact?: boolean; large?: boolean }>();
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
.칭찬도장.크게 {
  width: 94px;
  height: 94px;
  border-width: 3px;
  font-size: 15px;
  box-shadow: 0 3px 0 var(--테두리);
  animation: 도장찍기 .42s cubic-bezier(.2, 1.5, .4, 1) both;
}
.칭찬도장.크게::before { inset: 5px; border-width: 2px; }
@keyframes 도장찍기 {
  from { opacity: 0; transform: scale(1.35) rotate(8deg); }
  to { opacity: 1; transform: scale(1) rotate(-9deg); }
}
@media (max-width: 850px) {
  .칭찬도장.크게 { width: 72px; height: 72px; font-size: 12px; }
  .칭찬도장.크게::before { inset: 4px; }
}
@media (prefers-reduced-motion: reduce) {
  .칭찬도장.크게 { animation: none; }
}
</style>
