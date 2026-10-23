<template>
  <main class="필사실">
    <div class="페이지">
      <header class="상단">
        <div class="브랜드" aria-label="HALLATYPE 한글 필사">
          <span class="브랜드문양" aria-hidden="true">ㅎ</span>
          <span class="브랜드글자">HALLATYPE <small>한글 필사</small></span>
        </div>
        <span class="상단문구">손끝으로 읽는 시간</span>
      </header>

      <section class="소개" aria-labelledby="소개제목">
        <div>
          <p class="작은제목"><span class="작은점" aria-hidden="true"></span> 천천히 읽고, 한 자씩 쓰기</p>
          <h1 id="소개제목">글을 따라 쓰며<br><em>잠시 머무는 시간.</em></h1>
        </div>
        <p class="소개글">문장을 눈으로 읽고 손끝으로 다시 써 봅니다.<br>속도를 재지 않아도 괜찮아요. 지금의 글에만 집중해 보세요.</p>
      </section>

      <section class="작업공간" aria-label="필사할 글">
        <div class="선택머리">
          <div>
            <span class="구역번호">01 <span aria-hidden="true">/</span> 글 고르기</span>
            <h2>오늘 어떤 글에 머물까요?</h2>
          </div>
          <span class="선택안내">한 편 약 2분, 더 쓰고 싶을 때 이어가세요</span>
        </div>
        <div class="글선택" role="group" aria-label="필사할 글 선택">
          <button v-for="(지문, 번호) in 지문목록" :key="지문.제목" type="button" class="글버튼"
            :class="{ 선택됨: 선택된지문 === 번호 }" :aria-pressed="선택된지문 === 번호"
            @click="지문선택(번호, $event)">
            <span class="글번호">{{String(번호 + 1).padStart(2, '0')}}</span>
            <span class="글제목">{{지문.제목}}</span>
            <span class="선택표시" aria-hidden="true">↗</span>
          </button>
        </div>

        <article class="종이" aria-labelledby="지문제목">
          <div class="종이상단">
            <span>필사 노트 <span class="가운데점">·</span> {{String(선택된지문 + 1).padStart(2, '0')}}</span>
            <span class="종이장식" aria-hidden="true">✳</span>
          </div>
          <div class="지문머리">
            <p class="분류">오늘의 문장 <span class="편표시">· {{선택된편 + 1}} / {{현재편들.length}}</span></p>
            <h2 id="지문제목">{{지문목록[선택된지문].제목}}</h2>
            <p class="출처">
              {{지문목록[선택된지문].출처}}
              <a v-if="지문목록[선택된지문].원문" :href="지문목록[선택된지문].원문"
                target="_blank" rel="noopener noreferrer">원문 보기 ↗</a>
            </p>
          </div>
          <div class="가는선" aria-hidden="true"></div>

          <div class="캔버스영역">
            <canvas id="캔버스" width="1286" height="500"
              :aria-label="`${지문목록[선택된지문].제목} ${선택된편 + 1}편 필사 지문. 키보드로 따라 입력하세요.`"></canvas>
          </div>
        </article>

        <section class="진행판" aria-label="필사 진행 상황">
          <div class="진행영역">
            <div class="진행문구">
              <span class="상태표시" :class="{ 오류: 입력상태 === '오타', 완료: 결과화면보이기 }" aria-hidden="true"></span>
              <span role="status" aria-live="polite">{{상태문구}}</span>
              <span class="진행숫자">{{진행률}}%</span>
            </div>
            <div class="진행막대" role="progressbar" :aria-valuenow="진행률" aria-valuemin="0"
              aria-valuemax="100" :aria-label="`${지문목록[선택된지문].제목} ${선택된편 + 1}편 필사 진행률`">
              <span :style="{ width: `${진행률}%` }"></span>
            </div>
          </div>

          <div v-if="결과화면보이기" class="마침">
            <div class="마침문양" aria-hidden="true">✳</div>
            <div class="마침내용">
              <p class="마침꼬리">한 편을 마쳤어요</p>
              <h3>문장을 따라 걸어온 시간이<br>잠시 마음에 남기를 바랍니다.</h3>
              <p class="마침설명">여기서 마쳐도 좋고, 다음 편을 이어 써도 좋아요.</p>
              <dl class="마침통계" aria-label="이번 필사 기록">
                <div><dt>걸린 시간</dt><dd>{{걸린시간}}</dd></div>
                <div><dt>정타 / 총입력</dt><dd>{{정타수}}/{{총입력타수}}</dd></div>
                <div><dt>분당 정타</dt><dd>{{분당타수}}/분</dd></div>
              </dl>
            </div>
            <div class="마침동작">
              <button type="button" class="주버튼" @click="다음글">한 편 더 쓰기 <span aria-hidden="true">↗</span></button>
              <span class="다음안내">다음: {{다음편안내}}</span>
              <button type="button" class="글자버튼" @click="reset">한 번 더 쓰기</button>
            </div>
          </div>

          <div v-else class="진행아래">
            <span>띄어쓰기와 줄바꿈은 건너뛰어도 괜찮아요.</span>
            <button type="button" class="글자버튼" @click="reset">처음부터 다시 쓰기 <span aria-hidden="true">↺</span></button>
          </div>
        </section>

        <p class="작은도움">키보드로 지문을 따라 써 보세요. 글자의 획이 한 자씩 채워집니다.</p>
      </section>

      <footer class="바닥">
        <span>HALLATYPE</span>
        <span>한 글자씩, 천천히.</span>
      </footer>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 연습지문들, 필사편들 } from '@/practice-passages';

export default defineComponent({
  data() {
    return {
      지문목록: 연습지문들,
      선택된지문: 0,
      선택된편: 0,
      진행률: 0,
      입력상태: '대기' as '대기' | '진행' | '오타' | '정정',
      결과화면보이기: false,
      시작시각: null as number | null,
      완료초: 0,
      총입력타수: 0,
      정타수: 0,
      분당타수: 0,
      그림판: null as 그림판틀 | null,
    };
  },
  methods: {
    지문선택(번호: number, event: MouseEvent) {
      (event.currentTarget as HTMLElement).blur();
      if (this.선택된지문 === 번호 && this.선택된편 === 0) { return; }
      this.선택된지문 = 번호;
      this.선택된편 = 0;
      this.reset();
    },

    다음글() {
      if (this.선택된편 + 1 < this.현재편들.length) {
        this.선택된편++;
      } else {
        this.선택된지문 = (this.선택된지문 + 1) % this.지문목록.length;
        this.선택된편 = 0;
      }
      this.reset();
    },

    reset() {
      const 다시시작 = this.그림판 !== null;
      this.그림판?.종료();
      this.결과화면보이기 = false;
      this.진행률 = 0;
      this.입력상태 = '대기';
      this.시작시각 = null;
      this.완료초 = 0;
      this.총입력타수 = 0;
      this.정타수 = 0;
      this.분당타수 = 0;
      const 지문 = new 지문틀();
      지문.글쓰기(this.현재편들[this.선택된편]);
      지문.쓰기(지문.위치, 끝글자);
      const 본문 = new 따라그리기틀(지문);
      const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
      const ctx = 캔버스.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
      const 그림판 = markRaw(new 그림판틀(ctx, 본문));
      this.그림판 = 그림판;
      그림판.그리기();
      if (다시시작) {
        this.$nextTick(() => document.querySelector('.지문머리')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      }
      const self = this;
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
        if (self.시작시각 === null) { self.시작시각 = performance.now(); }
        const 직전오타 = self.입력상태 === '오타';
        const 바뀐위치 = 본문.입력(e.code, e.shiftKey);
        self.입력상태 = 본문.방금오타 ? '오타' : 직전오타 ? '정정' : '진행';
        if (본문.방금오타) {
          그림판.오타효과시작(본문.위치);
        } else {
          그림판.오타효과중지(false);
          그림판.변경그리기(바뀐위치);
        }
        self.진행률 = 본문.진행률;
        if (본문.끝) {
          const 걸린밀리초 = Math.max(1000, performance.now() - self.시작시각);
          self.완료초 = Math.max(1, Math.round(걸린밀리초 / 1000));
          self.총입력타수 = 본문.입력타수;
          self.정타수 = 본문.유효타수;
          self.분당타수 = Math.round(self.정타수 * 60000 / 걸린밀리초);
          self.결과화면보이기 = true;
          self.$nextTick(() => document.querySelector('.마침')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
        } else {
          const 커서세로 = 그림판.커서세로위치;
          if (커서세로 !== null) {
            const 경계 = window.innerHeight - 100;
            const 화면세로 = 캔버스.getBoundingClientRect().top + 커서세로 * 캔버스.clientHeight / 캔버스.height;
            if (화면세로 > 경계) { window.scrollBy(0, 화면세로 - 경계); }
          }
        }
      };
    },
  },
  mounted() {
    document.title = 'HALLATYPE · 한글 필사';
    this.reset();
  },
  beforeUnmount() {
    document.title = '한글 비트맵 스튜디오';
    window.onkeydown = null;
    this.그림판?.종료();
  },
  computed: {
    현재편들() {
      return 필사편들(this.지문목록[this.선택된지문]);
    },
    다음편안내() {
      if (this.선택된편 + 1 < this.현재편들.length) {
        return `${this.지문목록[this.선택된지문].제목} · ${this.선택된편 + 2}편`;
      }
      return `${this.지문목록[(this.선택된지문 + 1) % this.지문목록.length].제목} · 1편`;
    },
    걸린시간() {
      return `${Math.floor(this.완료초 / 60)}분 ${this.완료초 % 60}초`;
    },
    상태문구() {
      if (this.결과화면보이기) { return '오늘의 필사를 마쳤어요'; }
      if (this.입력상태 === '오타') { return '이 자리에서 다시 이어 써 보세요'; }
      if (this.입력상태 === '정정') { return '좋아요, 천천히 이어 가세요'; }
      if (this.입력상태 === '진행') { return '문장을 따라 쓰고 있어요'; }
      return '첫 글자를 눌러 시작해 보세요';
    },
  },
});
</script>

<style scoped lang="scss">
:global(body:has(.필사실)) {
  margin: 0;
  background: #f4f1e9;
}

.필사실 {
  min-height: 100vh;
  box-sizing: border-box;
  color: #38372f;
  background:
    radial-gradient(circle at 6% 5%, rgba(219, 206, 182, .25), transparent 31%),
    radial-gradient(circle at 94% 52%, rgba(219, 206, 182, .18), transparent 28%),
    #f4f1e9;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  -webkit-font-smoothing: antialiased;
}

button { font: inherit; }
.페이지 { max-width: 1100px; margin: 0 auto; padding: 0 34px; }

.상단 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 84px;
  border-bottom: 1px solid #ddd7ca;
}
.브랜드 { display: flex; align-items: center; gap: 11px; }
.브랜드문양 {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: #786c56;
  color: #fff;
  font-family: 'AppleMyungjo', 'Batang', serif;
  font-size: 18px;
  line-height: 1;
}
.브랜드글자 { color: #4c493f; font-size: 13px; font-weight: 800; letter-spacing: .12em; }
.브랜드글자 small { margin-left: 12px; color: #827e72; font-size: 12px; font-weight: 500; letter-spacing: 0; }
.상단문구 { color: #8b867a; font-size: 12px; letter-spacing: .03em; }

.소개 {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  padding: 60px 0 58px;
}
.작은제목, .분류, .마침꼬리 {
  color: #86745d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}
.작은제목 { display: flex; align-items: center; gap: 9px; margin: 0 0 18px; }
.작은점 { width: 7px; height: 7px; border-radius: 50%; background: #aa8e68; }
.소개 h1 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(35px, 4.2vw, 55px);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: 1.38;
}
.소개 h1 em { color: #8c7456; font-style: normal; }
.소개글 { margin: 0 2px 9px 0; color: #777468; font-size: 14px; line-height: 2.05; }

.작업공간 { padding-bottom: 84px; }
.선택머리 { display: flex; justify-content: space-between; align-items: end; gap: 20px; }
.구역번호 { color: #9c8b71; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.구역번호 span { padding: 0 5px; color: #c5baa7; }
.선택머리 h2 { margin: 9px 0 0; font-size: 18px; font-weight: 650; letter-spacing: -.045em; }
.선택안내 { padding-bottom: 2px; color: #9a958a; font-size: 12px; }
.글선택 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0 30px; }
.글버튼 {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 66px;
  padding: 0 19px;
  border: 1px solid #ddd8cc;
  border-radius: 3px;
  background: rgba(255, 255, 255, .44);
  color: #605d53;
  text-align: left;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .2s;
}
.글버튼:hover { transform: translateY(-2px); border-color: #b8aa93; background: #fffdf9; }
.글버튼.선택됨 { border-color: #9a8a70; background: #eae4d7; color: #413c32; }
.글번호 { color: #9e927f; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
.글제목 { font-size: 14px; font-weight: 650; }
.선택표시 { margin-left: auto; color: #9d8b72; font-size: 16px; }
.글버튼.선택됨 .선택표시 { color: #6e624f; }

.종이 {
  padding: 30px clamp(24px, 5.4vw, 73px) 27px;
  border: 1px solid #e8e3d9;
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 22px 60px rgba(81, 71, 54, .075), 0 2px 7px rgba(81, 71, 54, .035);
}
.종이상단 { display: flex; justify-content: space-between; align-items: center; color: #a39b8e; font-size: 11px; letter-spacing: .08em; }
.가운데점 { margin: 0 5px; }
.종이장식 { color: #b39d7b; font-size: 20px; }
.지문머리 { padding-top: 43px; text-align: center; }
.분류 { margin: 0 0 13px; }
.편표시 { color: #a99a83; font-weight: 500; }
.지문머리 h2 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(28px, 3vw, 37px);
  font-weight: 500;
  letter-spacing: -.04em;
}
.출처 { margin: 14px 0 0; color: #958e81; font-size: 12px; }
.출처 a { margin-left: 10px; color: #80735e; text-underline-offset: 3px; }
.출처 a:hover { color: #41382d; }
.가는선 { width: 42px; height: 1px; margin: 34px auto 0; background: #c9bda9; }
.캔버스영역 { display: flex; justify-content: center; max-width: 930px; margin: 26px auto 0; overflow: hidden; }
#캔버스 { display: block; width: 100%; height: auto; image-rendering: auto; }
.진행판 {
  box-sizing: border-box;
  max-width: 960px;
  margin: 32px auto 0;
  padding: 22px clamp(24px, 5.4vw, 73px) 20px;
  border: 1px solid #dfd8ca;
  border-radius: 3px;
  background: #ece7dc;
}
.진행영역 { max-width: 800px; margin: 0 auto; }
.진행문구 { display: flex; align-items: center; gap: 9px; color: #8b8579; font-size: 12px; }
.상태표시 { width: 6px; height: 6px; flex: none; border-radius: 50%; background: #b6ab98; }
.상태표시.오류 { background: #aa806d; }
.상태표시.완료 { background: #84947a; }
.진행숫자 { margin-left: auto; font-size: 11px; font-variant-numeric: tabular-nums; }
.진행막대 { height: 2px; margin-top: 13px; overflow: hidden; background: #d9d2c5; }
.진행막대 span { display: block; height: 100%; background: #9b8a6d; transition: width .2s ease; }
.진행아래 { display: flex; justify-content: space-between; align-items: center; gap: 20px; max-width: 800px; margin: 19px auto 0; color: #8f887a; font-size: 11px; }
.글자버튼 { padding: 4px 0; border: 0; background: none; color: #80735e; font-size: 12px; cursor: pointer; }
.글자버튼:hover { color: #41382d; text-decoration: underline; text-underline-offset: 4px; }
.글자버튼 span { margin-left: 4px; font-size: 16px; }
.작은도움 { margin: 21px 0 0; color: #969083; font-size: 12px; text-align: center; }

.마침 {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 800px;
  margin: 23px auto 0;
  padding: 23px 0 0;
  border-top: 1px solid #d9d2c5;
}
.마침문양 { align-self: flex-start; color: #aa9372; font-size: 25px; }
.마침꼬리 { margin: 0 0 10px; }
.마침내용 { min-width: 0; }
.마침 h3 { margin: 0; font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif; font-size: 20px; font-weight: 500; line-height: 1.55; }
.마침설명 { margin: 10px 0 0; color: #958f83; font-size: 12px; }
.마침통계 { display: flex; flex-wrap: wrap; gap: 12px 26px; margin: 24px 0 0; padding: 15px 0 0; border-top: 1px solid #d9d2c5; }
.마침통계 div { display: flex; flex-direction: column; gap: 5px; }
.마침통계 dt { color: #a19a8d; font-size: 11px; }
.마침통계 dd { margin: 0; color: #716b60; font-size: 12px; font-variant-numeric: tabular-nums; }
.마침동작 { display: flex; flex-direction: column; align-items: center; gap: 9px; margin-left: auto; }
.다음안내 { max-width: 180px; color: #958f83; font-size: 11px; text-align: center; line-height: 1.5; }
.주버튼 { min-width: 132px; padding: 11px 14px; border: 1px solid #82755f; border-radius: 2px; background: #82755f; color: #fff; font-size: 12px; cursor: pointer; }
.주버튼:hover { background: #665b49; }
.주버튼 span { margin-left: 12px; }
button:focus-visible { outline: 2px solid #947c5e; outline-offset: 3px; }
.바닥 { display: flex; justify-content: space-between; padding: 23px 0 34px; border-top: 1px solid #ddd7ca; color: #a39c8f; font-size: 11px; letter-spacing: .07em; }

@media (max-width: 700px) {
  .페이지 { padding: 0 18px; }
  .상단 { height: 66px; }
  .상단문구, .선택안내 { display: none; }
  .소개 { display: block; padding: 41px 0 42px; }
  .소개글 { margin-top: 22px; font-size: 13px; }
  .글선택 { gap: 6px; }
  .글버튼 { min-height: 57px; gap: 4px; flex-direction: column; justify-content: center; padding: 6px 3px; text-align: center; }
  .글번호 { font-size: 10px; }
  .글제목 { font-size: 12px; }
  .선택표시 { display: none; }
  .종이 { padding: 22px 17px 25px; }
  .지문머리 { padding-top: 34px; }
  .가는선 { margin-top: 27px; }
  .캔버스영역 { margin-top: 18px; }
  .진행판 { margin-top: 22px; padding: 18px 17px; }
  .진행아래 { align-items: start; flex-direction: column; gap: 11px; }
  .마침 { align-items: start; flex-wrap: wrap; gap: 14px; }
  .마침동작 { align-items: start; flex-direction: row; flex-wrap: wrap; width: 100%; margin: 3px 0 0 0; }
  .다음안내 { align-self: center; text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .글버튼, .진행막대 span { transition: none; }
}
</style>
