<template>
  <div class="연습">
    <h1>한글 타자 연습 <small>by hatemogi</small></h1>
    <canvas id="캔버스" width="1286" height="500"></canvas>
    <div class="글꼴설정">
      <label for="안티앨리어싱강도">안티앨리어싱 강도</label>
      <input id="안티앨리어싱강도" v-model.number="안티앨리어싱강도" type="range" min="0" max="300" step="10" @input="글꼴다시그리기" @keydown.stop>
      <output for="안티앨리어싱강도">{{안티앨리어싱강도}}%</output>
    </div>
    <div class="설명" v-if="!결과화면보이기">
      <h3>위 지문을 따라 입력하세요. 틀린 키는 다시 눌러야 진행됩니다. 정확도는 입력을 마치면 알려드립니다.</h3>
      <div class="진행상태">
        <span>{{소요시간}}</span>
        <span>타속: 분당 <strong>{{타속}}</strong>타</span>
      </div>
    </div>
    <!--div class="안내">
        이 프로그램은, 한글 타자 연습을 웹 애플리케이션으로 하면서, 자소별 진행 상황을 보이면
        좋겠다는 생각으로 출발한 프로토타입입니다. 예를 들어, 중성이 틀리면 중성 부분만 빨간색으로
        보여주는데요,
    </div-->
    <div class="결과" v-if="결과화면보이기">
      <h2>타자 연습 결과</h2>
      <table>
        <tbody>
          <tr><th>시간</th><td>{{소요시간}}</td></tr>
          <tr><th>유효타수</th><td>{{유효타수}} / {{기대타수}}</td></tr>
          <tr><th>정확도</th><td>{{정확도}}%</td></tr>
          <tr><th>타속</th><td>분당 <strong>{{타속}}</strong>타</td></tr>
        </tbody>
      </table>
      <button class="버튼" v-on:click="reset">다시하기</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';

export default defineComponent({
  data() {
    return {
      소요초: 0,
      기대타수: 0,
      유효타수: 0,
      타속: 0,
      결과화면보이기: false,
      인터벌핸들: 0,
      시작시각: 0,
      안티앨리어싱강도: 100,
      그림판: null as 그림판틀 | null,
    };
  },
  methods: {
    reset() {
        window.clearInterval(this.인터벌핸들);
        this.결과화면보이기 = false;
        this.소요초 = 0;
        this.유효타수 = 0;
        this.타속 = 0;
        this.시작시각 = 0;
        console.log('준비하기 눌림');
        const 지문 = new 지문틀();
        지문.글쓰기('오늘도 또 우리 수탉이 막 쫓기었다. 내가 점심을 먹고 나무를 하러 갈 양으로 나올 때이었다. ');
        지문.글쓰기('산으로 올라서려니까 등뒤에서 푸드득 푸드득 하고 닭의 횃소리가 야단이다. 깜짝 놀라서 ');
        지문.글쓰기('고개를 돌려보니 아니나다르랴 두 놈이 또 얼리었다.\n');
        지문.글쓰기('점순네 수탉이 덩저리 작은 우리 수탉을 함부로 ');
        지문.글쓰기('해내는 것이다. 그것도 그냥 해내는 것이 아니라 푸드득하고 면두를 쪼고 물러섰다가 좀 사이를 ');
        지문.글쓰기('두고 푸드득하고 모가지를 쪼았다. 이렇게 멋을 부려 가며 여지없이 닦아 놓는다. 그러면 이 못생긴 ');
        지문.글쓰기('것은 쪼일 적마다 주둥이로 땅을 받으며 그 비명이 킥, 킥, 할 뿐이다.'); /* 물론 미처 아물지도 않은 ');
        지문.글쓰기('면두를 또 쪼이며 붉은 선혈은 뚝뚝 떨어진다. 이걸 가만히 내려다보자니 내 대강이가 터져서 피가 ');
        지문.글쓰기('흐르는 것같이 두 눈에서 불이 번쩍 난다. 대뜸 지게막대기를 메고 달려들어 점순네 닭을 후려칠까 ');
        지문.글쓰기('하다가 생각을 고쳐먹고 헛매질로 떼어만 놓았다.');*/
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 따라그리기틀(지문);
        const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
        const ctx = 캔버스.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
        const 그림판 = markRaw(new 그림판틀(ctx, 본문));
        그림판.안티앨리어싱강도설정(this.안티앨리어싱강도);
        this.그림판 = 그림판;
        그림판.그리기();
        this.기대타수 = 본문.기대타수;
        const self = this;
        let 시작함 = false;
        window.onkeydown = (e: KeyboardEvent) => {
            if (e.code.startsWith('Shift') || e.code.startsWith('Control') ||
                e.code.startsWith('Alt') || e.code.startsWith('Meta') ||
                e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta') ||
                !/^(Key[A-Z]|Digit[0-9]|Space|Enter|Backspace|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(e.code) ||
                self.결과화면보이기) {
                return;
            }
            e.preventDefault();
            if (!시작함) {
                시작함 = true;
                self.타이머시작();
            }
            const 바뀐위치 = 본문.입력(e.code, e.shiftKey);
            그림판.변경그리기(바뀐위치);
            self.유효타수 = 본문.유효타수;
            self.진행상태갱신();
            if (본문.끝) {
                self.입력끝();
            }
        };
    },

    글꼴다시그리기() {
        this.그림판?.안티앨리어싱강도설정(this.안티앨리어싱강도);
        this.그림판?.그리기();
    },

    타이머시작() {
        this.시작시각 = performance.now();
        this.인터벌핸들 = window.setInterval(() => {
            this.진행상태갱신();
        }, 1000);
    },

    진행상태갱신() {
        const 경과초 = (performance.now() - this.시작시각) / 1000;
        this.소요초 = Math.floor(경과초);
        this.타속 = Math.floor(this.유효타수 * 60 / Math.max(1, 경과초));
    },

    입력끝() {
        window.clearInterval(this.인터벌핸들);
        this.진행상태갱신();
        this.결과화면보이기 = true;
    },
  },
  mounted() {
    this.reset();
  },
  beforeUnmount() {
    window.onkeydown = null;
    window.clearInterval(this.인터벌핸들);
  },
  computed: {
    소요시간() {
        const 분 = Math.floor(this.소요초 / 60);
        const 초 = this.소요초 % 60;
        return `${분}:${초 < 10 ? '0' + 초 : 초}`;
    },

    정확도() {
        return Math.floor(this.유효타수 * 100 / this.기대타수);
    },
  },
});

</script>

<style lang="scss">

.연습 {
    width: 850px;
    margin: auto;
}

.안내 {
    text-align: left;
    margin-top: 50px;
}

.결과 {
    font-size: 1.5rem;
    text-align: left;
    background-color: #eee;
    border-radius: 5px;
    margin: 1rem;
    padding: 20px;
}

#캔버스 {
  width: 643px;
  height: 250px;
  border: 1px solid black;
  border-radius: 3px;
  padding: 3px;
  zoom: 100%;
}

.글꼴설정 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 12px 0 20px;
  font-size: 14px;
}

.글꼴설정 input {
  width: 240px;
}

.글꼴설정 output {
  min-width: 44px;
  text-align: right;
}

.진행상태 {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.버튼 {
  text-align: center;
  color: white;
  width: 140px;
  height: 3rem;
  font-size: 1.5rem;
  background-color: #268bd2;
  border: 1px solid white;
  border-radius: 3px;
  margin: 30px;
}

th {
  width: 100px;
}
</style>
