<template>
  <div class="home">
    <canvas id="캔버스" width="640" height="400"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 글자꼴 } from '@/글자';
import { 지문틀, 본문틀 } from '@/본문';
import { 입력머신틀, 위치이동 } from '@/입력';
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
    지문.쓰기('오늘도 또 우리 수탉이 막 쫓기었다. 내가 점심을 먹고 나무를 하러 갈 양으로 나올 때이었다. ');
    지문.쓰기('산으로 올라서려니까 등뒤에서 푸드득 푸드득 하고 닭의 횃소리가 야단이다. 깜짝 놀라서 ');
    지문.쓰기('고개를 돌려보니 아니나다르랴 두 놈이 또 얼리었다.');
    문서.영역그리기([0, 5]);
    window.onkeydown = (e: KeyboardEvent) => {
      // 컨트롤키 입력은 무시
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return;
      const [이동, 완성, 조립] = 입력머신.입력([e.getModifierState('Shift'), e.code]);
      console.debug(`[${이동}, [${완성}], [${조립.코드}]]`);
      switch (이동) {
        case 위치이동.유지:
          문서.글자쓰기(조립);
          break;
        case 위치이동.다음:
          완성.forEach((글자: 글자꼴) => {
            문서.글자쓰기(글자);
            문서.다음위치();
          });
          문서.글자쓰기(조립);
          break;
      }
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