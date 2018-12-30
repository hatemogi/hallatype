<template>
  <div class="home">
    <canvas id="캔버스" width="640" height="400"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 지문, 본문 } from '@/document';
import Graphics from '@/graphics';

@Component
export default class Home extends Vue {
  public mounted() {
    const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
    const ctx = 캔버스.getContext('2d') as CanvasRenderingContext2D;
    const 그림판 = new Graphics(ctx);
    const 바닥글 = new 지문();
    바닥글.쓰기("텍스트, 오 써졌다! 한 번에 되다니 놀라운 걸? 다음줄 처리가 되긴하는데, 이상한 문자가 써진다. ABCDEFGHIJKLMNOP");
    const 문서 = new 본문(바닥글, 그림판);
    문서.영역그리기([0, 5]);
    window.onkeydown = (e: KeyboardEvent) => {
      console.log(`key=${e.key}, code=${e.code}, shift=${e.getModifierState('Shift')}`);
    };
  }
}
</script>

<style lang="scss">
#캔버스 {
  border: 1px solid black;
  zoom: 120%;
}
</style>