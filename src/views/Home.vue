<template>
  <div class="home">
    <canvas id="캔버스" width="643" height="250"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 글자꼴, 글자없음, 끝글자 } from '@/글자';
import { 지문틀, 본문틀 } from '@/본문';
import { 입력모드, 입력머신틀, 위치이동 } from '@/입력';
import 그림판틀 from '@/그림판';

@Component
export default class Home extends Vue {
  public mounted() {
    const 지문 = new 지문틀();
    const 본문 = new 본문틀(지문);
    const 입력머신 = new 입력머신틀();
    지문.글쓰기('오늘도 또 우리 수탉이 막 쫓기었다. 내가 점심을 먹고 나무를 하러 갈 양으로 나올 때이었다. ');
    지문.글쓰기('산으로 올라서려니까 등뒤에서 푸드득 푸드득 하고 닭의 횃소리가 야단이다. 깜짝 놀라서 ');
    지문.글쓰기('고개를 돌려보니 아니나다르랴 두 놈이 또 얼리었다.\n');
    지문.글쓰기('점순네 수탉이 덩저리 작은 우리 수탉을 함부로 ');
    지문.글쓰기('해내는 것이다. 그것도 그냥 해내는 것이 아니라 푸드득하고 면두를 쪼고 물러섰다가 좀 사이를 ');
    지문.글쓰기('두고 푸드득하고 모가지를 쪼았다. 이렇게 멋을 부려 가며 여지없이 닦아 놓는다. 그러면 이 못생긴 ');
    지문.글쓰기('것은 쪼일 적마다 주둥이로 땅을 받으며 그 비명이 킥, 킥, 할 뿐이다. 물론 미처 아물지도 않은 ');
    지문.글쓰기('면두를 또 쪼이며 붉은 선혈은 뚝뚝 떨어진다. 이걸 가만히 내려다보자니 내 대강이가 터져서 피가 ');
    지문.글쓰기('흐르는 것같이 두 눈에서 불이 번쩍 난다. 대뜸 지게막대기를 메고 달려들어 점순네 닭을 후려칠까 ');
    지문.글쓰기('하다가 생각을 고쳐먹고 헛매질로 떼어만 놓았다.\n');
    지문.쓰기(지문.위치, 끝글자);
    const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
    const ctx = 캔버스.getContext('2d') as CanvasRenderingContext2D;
    const 그림판 = new 그림판틀(ctx, 본문);
    그림판.그리기();
    window.onkeydown = (e: KeyboardEvent) => {
      // 컨트롤키 입력은 무시
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
          e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta')) {
            return;
      }
      const 단순키코드 = e.code.replace('Key', '').replace('Digit', '');
      const [이동, 완성, 조립] = 입력머신.입력([입력모드.한글, e.getModifierState('Shift'), 단순키코드]);
      switch (이동) {
        case 위치이동.유지:
          본문.쓰기(조립);
          break;
        case 위치이동.다음:
          완성.forEach((글자: 글자꼴) => {
            본문.쓰기(글자).다음();
          });
          본문.쓰기(조립);
          break;
        case 위치이동.이전:
          본문.쓰기(글자없음).이전().쓰기(글자없음);
      }
      그림판.그리기();
      if (본문.끝) {
        console.log('입력 끝');
      }
    };
  }
}
</script>

<style lang="scss">
#캔버스 {
  border: 1px solid black;
  padding: 3px;
  zoom: 110%;
}
</style>