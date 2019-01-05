<template>
  <div class="home">
    <canvas id="캔버스" width="640" height="400"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 지문틀, 본문틀 } from '@/본문';
import 그림판틀 from '@/그림판';

@Component
export default class Home extends Vue {
  public mounted() {
    const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
    const ctx = 캔버스.getContext('2d') as CanvasRenderingContext2D;
    const 그림판 = new 그림판틀(ctx);
    const 지문 = new 지문틀();
    const 문서 = new 본문틀(지문, 그림판);
    지문.쓰기('텍스트, 오 써졌다! 한 번에 되다니 놀라운 걸? "다음줄" 처리가 되긴하는데, \n이상한 문자가 써진다. ABCDEFGHIJKLMNOP');
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
  zoom: 110%;
}
</style>