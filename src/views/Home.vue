<template>
  <div class="연습">
    <h1>hatemogi의 한글 타자 연습</h1>
    <canvas id="캔버스" width="643" height="250"></canvas>
    <div class="설명" v-if="!결과화면보이기">
      <h3>위 지문을 따라 입력하고 나면, 타자 속도와 정확도를 알려드립니다.</h3>
      <div>{{소요시간}}</div>
    </div>
    <!--div class="안내">
        이 프로그램은, 한글 타자 연습을 웹 애플리케이션으로 하면서, 자소별 진행 상황을 보이면
        좋겠다는 생각으로 출발한 프로토타입입니다. 예를 들어, 중성이 틀리면 중성 부분만 빨간색으로
        보여주는데요,
    </div-->
    <div class="결과" v-if="결과화면보이기">
      <h2>타자 연습 결과</h2>
      <table>
        <tr><th>시간</th><td>{{소요시간}}</td></tr>
        <tr><th>유효타수</th><td>{{유효타수}} / {{기대타수}}</td></tr>
        <tr><th>타속</th><td>분당 <strong>{{타속}}</strong>타</td></tr>
      </table>
      <button class="버튼" v-on:click="reset">다시하기</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { 글자꼴, 글자없음, 끝글자, 색칠할글자 } from '@/글자';
import { 지문틀, 본문틀 } from '@/본문';
import { 입력모드, 입력머신틀, 위치이동, 필요타수 } from '@/입력';
import 그림판틀 from '@/그림판';

@Component
export default class Home extends Vue {
    public 소요초 = 0;
    public 기대타수 = 0;
    public 유효타수 = 0;
    public 타속 = 0;
    public 결과화면보이기 = false;
    private 인터벌핸들 = 0;

    public reset() {
        this.결과화면보이기 = false;
        this.소요초 = 0;
        console.log('준비하기 눌림');
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
        지문.글쓰기('하다가 생각을 고쳐먹고 헛매질로 떼어만 놓았다.');
        지문.쓰기(지문.위치, 끝글자);
        const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
        const ctx = 캔버스.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        그림판.그리기();
        this.기대타수 = 타수구하기(본문.글자스트림());
        const self = this;
        let 시작함 = false;
        window.onkeydown = (e: KeyboardEvent) => {
            // 컨트롤키 입력은 무시
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
                e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta')) {
                return;
            }
            if (!시작함) {
                시작함 = true;
                self.타이머시작();
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
                self.입력끝(본문.유효타수);
            }
        };
    }

    public mounted() {
        this.reset();
    }

    public keydown(e: KeyboardEvent) {
        (e.target as HTMLInputElement).value = '';
    }

    public get 소요시간() {
        const 분 = Math.floor(this.소요초 / 60);
        const 초 = this.소요초 % 60;
        return `${분}:${초 < 10 ? '0' + 초 : 초}`;
    }

    private 타이머시작() {
        const 시작시간 = new Date().getTime() / 1000;
        this.인터벌핸들 = setInterval(() => {
            this.소요초 = Math.floor((new Date().getTime() / 1000) - 시작시간);
        }, 1000);
    }

    private 입력끝(유효타수: number) {
        clearInterval(this.인터벌핸들);
        this.유효타수 = 유효타수;
        this.타속 = Math.floor(this.유효타수 * 60 / this.소요초);
        this.결과화면보이기 = true;
    }


}

function 타수구하기(글자들: Iterator<색칠할글자>): number {
    let 타수 = 0;
    while (true) {
        const 다음 = 글자들.next();
        if (다음.done) {
            break;
        }
        필요타수(다음.value.자).forEach((타) => 타수 += 타);
    }
    return 타수;
}

</script>

<style lang="scss">

.연습 {
    width: 720px;
    margin: auto;
}

.안내 {
    text-align: left;
    margin-top: 50px;
}

.결과 {
    font-size: 1.4rem;
    text-align: left;
    background-color: #eee;
    border-radius: 5px;
    padding: 20px;
}

#캔버스 {
  border: 1px solid black;
  padding: 3px;
  zoom: 110%;
}

.버튼 {
  text-align: center;
  color: white;
  width: 120px;
  height: 2rem;
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