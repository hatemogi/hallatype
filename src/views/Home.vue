<template>
  <div class="home">
    <canvas id="캔버스" width="640" height="400"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 지문틀, 본문틀 } from '@/본문';
import { 입력머신틀 } from '@/입력';
import 그림판틀 from '@/그림판';

@Component
export default class Home extends Vue {
  public mounted() {
    const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
    const ctx = 캔버스.getContext('2d') as CanvasRenderingContext2D;
    const 그림판 = new 그림판틀(ctx);
    const 지문 = new 지문틀();
    const 문서 = new 본문틀(지문, 그림판);
    const 입력머신 = new 입력머신틀();
    지문.쓰기('HTML5 캔버스에 비트맵 글꼴을 써서, 한글을 자소별로 다른 색상으로 보이는 데모입니다.\n');
    지문.쓰기('과연 자소별 색상 출력이 얼마나 중요한 기능일지는 아직 잘 모르겠습니다만...');
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