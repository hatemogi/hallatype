<template>
  <main class="연습">
    <header class="브랜드">
      <p class="브랜드표식">HALLATYPE <span>//</span> TYPE PRACTICE</p>
      <h1>한글 타자 연습</h1>
      <p class="브랜드설명">둥근모꼴로 따라 그리는 한글 지문</p>
    </header>

    <section class="프로그램창" aria-label="장문 따라그리기">
      <div class="제목줄">
        <span class="창아이콘" aria-hidden="true">▦</span>
        <strong>HALLATYPE</strong>
        <span class="제목구분">/</span>
        <span>장문 따라그리기</span>
        <span class="제목번호">{{String(선택된지문 + 1).padStart(2, '0')}}</span>
      </div>
      <div class="메뉴줄" role="group" aria-label="연습 지문 선택">
        <span class="메뉴제목">지문 선택</span>
        <button v-for="(지문, 번호) in 지문목록" :key="지문.제목" type="button" class="지문버튼"
          :class="{ 선택됨: 선택된지문 === 번호 }" :aria-pressed="선택된지문 === 번호"
          @click="지문선택(번호, $event)">
          <span class="지문번호">{{String(번호 + 1).padStart(2, '0')}}</span> {{지문.제목}}
        </button>
        <span class="메뉴끝">한글 2벌식</span>
      </div>

      <div class="창내용">
        <div class="화면머리">
          <span><span class="화면머리표식" aria-hidden="true">■</span> 지문 화면</span>
          <span>{{지문목록[선택된지문].출처}}</span>
        </div>
        <div class="화면테두리">
          <canvas id="캔버스" width="1286" height="500" aria-label="따라 입력할 지문"></canvas>
        </div>

        <div class="상태줄">
          <span class="연결상태"><span class="상태등" aria-hidden="true"></span>{{결과화면보이기 ? '연습 완료' : 시작시각 ? '입력 중' : '입력 대기'}}</span>
          <span>경과 <strong>{{소요시간}}</strong></span>
          <span>분당 <strong>{{타속}}</strong>타</span>
          <span class="상태오른쪽">SPACE · ENTER 선택</span>
        </div>

        <div v-if="!결과화면보이기" class="아래패널">
          <div class="설명">
            <span class="패널표식">안내</span>
            <p>지문을 따라 입력하세요. 띄어쓰기와 줄바꿈은 건너뛸 수 있습니다. 오타는 올바른 키를 눌러 정정하세요.</p>
          </div>
          <div class="글꼴설정">
            <label for="안티앨리어싱강도">글꼴 부드럽게</label>
            <input id="안티앨리어싱강도" v-model.number="안티앨리어싱강도" type="range" min="0" max="300" step="10" @input="글꼴다시그리기" @keydown.stop>
            <output for="안티앨리어싱강도">{{안티앨리어싱강도}}%</output>
          </div>
        </div>

        <div v-else class="결과">
          <div class="결과머리"><span class="패널표식">완료</span><h2>타자 연습 결과</h2></div>
          <div class="결과내용">
            <table>
              <tbody>
                <tr><th scope="row">시간</th><td>{{소요시간}}</td></tr>
                <tr><th scope="row">유효타수</th><td>{{유효타수}} / {{기대타수}}</td></tr>
                <tr><th scope="row">정확도</th><td>{{정확도}}%</td></tr>
                <tr><th scope="row">타속</th><td>분당 <strong>{{타속}}</strong>타</td></tr>
              </tbody>
            </table>
            <button class="버튼" type="button" @click="reset">다시하기 <span aria-hidden="true">↵</span></button>
          </div>
        </div>
      </div>
    </section>
    <footer class="바닥말"><span>HALLATYPE</span><span>by hatemogi</span></footer>
  </main>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 연습지문들 } from '@/practice-passages';

export default defineComponent({
  data() {
    return {
      지문목록: 연습지문들,
      선택된지문: 0,
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
    지문선택(번호: number, event: MouseEvent) {
        (event.currentTarget as HTMLElement).blur();
        if (this.선택된지문 === 번호) { return; }
        this.선택된지문 = 번호;
        this.reset();
    },

    reset() {
        window.clearInterval(this.인터벌핸들);
        this.그림판?.오타효과중지(false);
        this.결과화면보이기 = false;
        this.소요초 = 0;
        this.유효타수 = 0;
        this.타속 = 0;
        this.시작시각 = 0;
        const 지문 = new 지문틀();
        지문.글쓰기(this.지문목록[this.선택된지문].본문);
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
            if ((e.target as HTMLElement | null)?.closest('button, input, select, textarea, [contenteditable="true"]')) {
                return;
            }
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
            if (본문.방금오타) {
                그림판.오타효과시작(본문.위치);
            } else {
                그림판.오타효과중지(false);
                그림판.변경그리기(바뀐위치);
            }
            self.유효타수 = 본문.유효타수;
            self.기대타수 = 본문.기대타수;
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
    this.그림판?.오타효과중지(false);
  },
  computed: {
    소요시간() {
        const 분 = Math.floor(this.소요초 / 60);
        const 초 = this.소요초 % 60;
        return `${분}:${초 < 10 ? '0' + 초 : 초}`;
    },

    정확도() {
        return this.기대타수 ? Math.floor(this.유효타수 * 100 / this.기대타수) : 100;
    },
  },
});

</script>

<style scoped lang="scss">
:global(body:has(.연습)) {
  margin: 0;
}

.연습 {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 38px 22px 20px;
  background: #1415ad;
  color: #202733;
  font-family: 'Courier New', 'Apple SD Gothic Neo', 'Malgun Gothic', monospace;
}

.브랜드 {
  max-width: 820px;
  margin: 0 auto 20px;
  text-align: left;
  color: #fff;
}

.브랜드표식 {
  margin: 0 0 5px;
  color: #b9ddcf;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .17em;
}

.브랜드표식 span {
  color: #fff39c;
  padding: 0 4px;
}

.브랜드 h1 {
  margin: 0;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 800;
  letter-spacing: -.045em;
  line-height: 1.2;
}

.브랜드설명 {
  margin: 5px 0 0;
  color: #ccd2ff;
  font-size: 13px;
}

.프로그램창 {
  box-sizing: border-box;
  max-width: 820px;
  margin: 0 auto;
  border: 3px solid #dbdddc;
  background: #c9cbca;
  box-shadow: inset 2px 2px #fff, inset -2px -2px #606671, 8px 10px 0 #09096f;
  text-align: left;
}

.제목줄 {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 39px;
  padding: 0 12px;
  border-bottom: 2px solid #2b777d;
  background: #389ba0;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .02em;
  text-shadow: 1px 1px #21676d;
}

.창아이콘 {
  color: #ffec8c;
  font-size: 18px;
  line-height: 1;
}

.제목구분 {
  opacity: .55;
}

.제목번호 {
  margin-left: auto;
  padding: 3px 7px;
  border: 1px solid #b2d8d5;
  color: #ebf9f6;
  font-size: 11px;
}

.메뉴줄 {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 43px;
  padding: 5px 12px;
  border-bottom: 1px solid #81878b;
  color: #49525c;
  font-size: 12px;
  font-weight: 700;
}

.메뉴제목 {
  flex: none;
  margin-right: 5px;
}

.지문버튼 {
  padding: 6px 9px;
  border: 1px solid;
  border-color: #fff #898f91 #898f91 #fff;
  background: #e1e3e1;
  color: #39454d;
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.지문버튼:hover {
  background: #f0f2ef;
}

.지문버튼.선택됨 {
  border-color: #206d72;
  background: #368f93;
  box-shadow: inset 1px 1px #256f73;
  color: #fff;
}

.지문버튼:focus-visible {
  outline: 2px solid #1415ad;
  outline-offset: 2px;
}

.지문번호 {
  margin-right: 4px;
  opacity: .7;
}

.메뉴끝 {
  margin-left: auto;
  font-size: 11px;
  white-space: nowrap;
}

.창내용 {
  padding: 15px 18px 17px;
}

.화면머리 {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 3px 8px;
  color: #454d58;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .02em;
}

.화면머리표식 {
  margin-right: 7px;
  color: #238689;
  font-size: 10px;
}

.화면테두리 {
  display: flex;
  justify-content: center;
  padding: 9px;
  border: 2px solid;
  border-color: #626871 #fff #fff #626871;
  background: #fff;
  box-shadow: inset 1px 1px #292f3a;
}

#캔버스 {
  display: block;
  width: min(100%, 643px);
  height: auto;
  background: #fff;
}

.상태줄 {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  min-height: 35px;
  margin-top: 10px;
  border: 1px solid #8f9799;
  border-right-color: #fff;
  border-bottom-color: #fff;
  background: #dedfdb;
  color: #3f4953;
  font-size: 12px;
}

.상태줄 > span {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-right: 1px solid #a8afb0;
}

.상태줄 strong {
  color: #172b38;
  font-size: 14px;
}

.연결상태 {
  min-width: 105px;
  color: #176f53;
  font-weight: 700;
}

.상태등 {
  width: 7px;
  height: 7px;
  border: 1px solid #155c45;
  background: #36bb74;
  box-shadow: 0 0 0 2px #b5d4bf;
}

.상태줄 .상태오른쪽 {
  margin-left: auto;
  border-right: 0;
  color: #505b66;
  font-size: 11px;
  letter-spacing: .02em;
}

.아래패널 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 248px;
  gap: 18px;
  align-items: center;
  padding-top: 15px;
}

.설명 {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #36404a;
}

.설명 p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.패널표식 {
  flex: none;
  padding: 4px 6px 3px;
  border: 1px solid #2a7778;
  background: #d5f1e9;
  color: #176a6d;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.글꼴설정 {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px 8px;
  padding: 9px 10px;
  border: 1px solid;
  border-color: #8b9294 #fff #fff #8b9294;
  background: #e1e2df;
  color: #404c56;
  font-size: 11px;
}

.글꼴설정 label {
  text-align: left;
  font-weight: 700;
}

.글꼴설정 input {
  grid-column: 1 / -1;
  width: 100%;
  margin: 0;
  accent-color: #258e90;
  cursor: pointer;
}

.글꼴설정 output {
  color: #146e72;
  font-weight: 700;
  text-align: right;
}

.결과 {
  margin-top: 15px;
  border: 1px solid #8b9294;
  border-right-color: #fff;
  border-bottom-color: #fff;
  background: #e1e2df;
}

.결과머리 {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid #b2b7b8;
}

.결과 h2 {
  margin: 0;
  font-size: 15px;
}

.결과내용 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 14px 13px;
}

.결과 table {
  border-collapse: collapse;
  font-size: 12px;
}

.결과 th,
.결과 td {
  padding: 3px 22px 3px 0;
  text-align: left;
}

.결과 th {
  color: #68717b;
  font-weight: 400;
}

.결과 td {
  color: #1e313d;
  font-weight: 700;
}

.버튼 {
  flex: none;
  min-width: 125px;
  padding: 10px 13px;
  border: 2px solid;
  border-color: #fff #71787a #71787a #fff;
  background: #348f91;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.버튼:hover {
  background: #227b7f;
}

.버튼:active {
  border-color: #71787a #fff #fff #71787a;
}

.버튼:focus-visible,
.글꼴설정 input:focus-visible {
  outline: 2px solid #1415ad;
  outline-offset: 3px;
}

.버튼 span {
  margin-left: 10px;
}

.바닥말 {
  display: flex;
  justify-content: space-between;
  max-width: 820px;
  margin: 14px auto 0;
  color: #aeb8fa;
  font-size: 11px;
  letter-spacing: .04em;
}

@media (max-width: 680px) {
  .연습 { padding: 24px 12px 18px; }
  .프로그램창 { box-shadow: 4px 5px 0 #09096f; }
  .창내용 { padding: 12px; }
  .메뉴줄 { gap: 4px; padding: 5px 9px; }
  .메뉴제목, .메뉴끝 { display: none; }
  .지문버튼 { flex: 1; padding: 6px 3px; font-size: 10px; }
  .지문번호 { margin-right: 1px; }
  .화면머리 { font-size: 10px; }
  .상태줄 .상태오른쪽 { display: none; }
  .아래패널 { grid-template-columns: 1fr; gap: 12px; }
  .결과내용 { align-items: flex-start; flex-direction: column; }
}
</style>
