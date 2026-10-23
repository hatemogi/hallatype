<template>
  <main class="필사실" :data-theme="설정.테마">
    <div class="페이지">
      <header class="상단">
        <div class="브랜드" aria-label="HALLATYPE 한글 필사">
          <span class="브랜드문양" aria-hidden="true">ㅎ</span>
          <span class="브랜드글자">HALLATYPE <small>한글 필사</small></span>
        </div>
        <div class="상단동작">
          <span class="상단문구">손끝으로 읽는 시간</span>
          <button type="button" class="설정버튼" aria-controls="필사설정"
            :aria-expanded="설정열림" @click="설정열림 = !설정열림">환경설정 <span aria-hidden="true">⚙</span></button>
        </div>
        <section v-show="설정열림" id="필사설정" class="설정패널" aria-label="필사 환경설정">
          <div class="설정머리">
            <strong>환경설정</strong>
            <button type="button" class="설정닫기" aria-label="환경설정 닫기" @click="설정열림 = false">×</button>
          </div>
          <fieldset>
            <legend>색상 테마</legend>
            <div class="테마선택">
              <button v-for="테마 in 테마선택지" :key="테마.이름" type="button" class="테마버튼"
                :class="{ 선택됨: 설정.테마 === 테마.이름 }" :aria-pressed="설정.테마 === 테마.이름"
                @click="설정변경({ 테마: 테마.이름 })">
                <span class="테마견본" :data-theme="테마.이름" aria-hidden="true">가</span>
                <span>{{테마.이름}}</span>
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>지문 글자 크기</legend>
            <div class="설정선택">
              <button v-for="크기 in 글자크기선택지" :key="크기" type="button"
                :class="{ 선택됨: 설정.글자크기 === 크기 }" :aria-pressed="설정.글자크기 === 크기"
                @click="설정변경({ 글자크기: 크기 })">{{크기}}</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>글자 가장자리</legend>
            <div class="가장자리선택">
              <input type="range" min="0" max="4" step="1" :value="설정.안티앨리어싱단계"
                aria-label="글자 가장자리 부드러움" :aria-valuetext="가장자리단계이름[설정.안티앨리어싱단계]"
                @input="가장자리변경">
              <div class="가장자리눈금" aria-hidden="true"><span v-for="눈금 in 5" :key="눈금"></span></div>
              <div class="가장자리끝표시" aria-hidden="true"><span>선명하게</span><span>부드럽게</span></div>
            </div>
          </fieldset>
          <fieldset>
            <legend>커서 깜빡임</legend>
            <div class="설정선택">
              <button type="button" :class="{ 선택됨: 설정.커서깜빡임 }" :aria-pressed="설정.커서깜빡임"
                @click="설정변경({ 커서깜빡임: true })">켜기</button>
              <button type="button" :class="{ 선택됨: !설정.커서깜빡임 }" :aria-pressed="!설정.커서깜빡임"
                @click="설정변경({ 커서깜빡임: false })">끄기</button>
            </div>
          </fieldset>
          <p class="설정안내">선택한 설정은 이 브라우저에 저장됩니다.</p>
        </section>
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
import { 기본필사설정, 필사설정, 필사설정읽기, 필사설정저장,
  필사테마, 지문크기, 안티앨리어싱단계, 단계별안티앨리어싱강도, 필사팔레트들 } from '@/practice-settings';

const 테마선택지: Array<{ 이름: 필사테마 }> = [{ 이름: '한지' }, { 이름: '새벽' }, { 이름: '밤' }];
const 글자크기선택지: 지문크기[] = ['보통', '크게'];
const 가장자리단계이름 = ['선명하게', '조금 선명하게', '보통', '조금 부드럽게', '부드럽게'];

export default defineComponent({
  data() {
    return {
      지문목록: 연습지문들,
      테마선택지,
      글자크기선택지,
      가장자리단계이름,
      설정: { ...기본필사설정 } as 필사설정,
      설정열림: false,
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
      본문: null as 따라그리기틀 | null,
    };
  },
  methods: {
    가장자리변경(event: Event) {
      this.설정변경({ 안티앨리어싱단계: Number((event.target as HTMLInputElement).value) as 안티앨리어싱단계 });
    },
    설정밖클릭(event: PointerEvent) {
      if (this.설정열림 && event.target instanceof Element && !event.target.closest('.상단')) {
        this.설정열림 = false;
      }
    },

    설정변경(변경: Partial<필사설정>) {
      this.설정 = { ...this.설정, ...변경 };
      필사설정저장(this.설정);
      const 팔레트 = 필사팔레트들[this.설정.테마];
      this.본문?.팔레트설정(팔레트);
      this.그림판?.안티앨리어싱강도설정(단계별안티앨리어싱강도[this.설정.안티앨리어싱단계]);
      this.그림판?.보기설정(팔레트, this.설정.글자크기 === '크게' ? 68 : 80,
        this.설정.커서깜빡임);
    },

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
      const 팔레트 = 필사팔레트들[this.설정.테마];
      const 본문 = markRaw(new 따라그리기틀(지문, 팔레트));
      this.본문 = 본문;
      const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
      const ctx = 캔버스.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
      const 그림판 = markRaw(new 그림판틀(ctx, 본문, {
        팔레트, 한줄칸수: this.설정.글자크기 === '크게' ? 68 : 80,
        커서깜빡임: this.설정.커서깜빡임,
        안티앨리어싱: 단계별안티앨리어싱강도[this.설정.안티앨리어싱단계],
        영문글꼴: this.지문목록[this.선택된지문].언어 === 'en',
      }));
      this.그림판 = 그림판;
      그림판.그리기();
      if (다시시작) {
        this.$nextTick(() => document.querySelector('.지문머리')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      }
      const self = this;
      window.onkeydown = (e: KeyboardEvent) => {
        if (e.code === 'Escape' && self.설정열림) {
          self.설정열림 = false;
          return;
        }
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
    this.설정 = 필사설정읽기();
    document.addEventListener('pointerdown', this.설정밖클릭);
    this.reset();
  },
  beforeUnmount() {
    document.title = '한글 비트맵 스튜디오';
    document.removeEventListener('pointerdown', this.설정밖클릭);
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
}

.필사실 {
  --화면: #f4f1e9;
  --장식빛: rgba(219, 206, 182, .25);
  --글: #38372f;
  --보조글: #777468;
  --옅은글: #958e81;
  --강조: #82755f;
  --강조호버: #665b49;
  --역글: #fff;
  --테두리: #ddd7ca;
  --연테두리: #e8e3d9;
  --종이: #fff;
  --선택바탕: #eae4d7;
  --선택안함: rgba(255, 255, 255, .44);
  --호버바탕: #fffdf9;
  --진행바탕: #ece7dc;
  --진행테두리: #dfd8ca;
  --진행선: #d9d2c5;
  --진행활성: #9b8a6d;
  --오류색: #aa806d;
  --완료색: #84947a;
  min-height: 100vh;
  box-sizing: border-box;
  color: var(--글);
  background:
    radial-gradient(circle at 6% 5%, var(--장식빛), transparent 31%),
    radial-gradient(circle at 94% 52%, var(--장식빛), transparent 28%),
    var(--화면);
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.필사실[data-theme='새벽'] {
  --화면: #e9f0f2;
  --장식빛: rgba(171, 199, 208, .26);
  --글: #30444f;
  --보조글: #647b85;
  --옅은글: #718892;
  --강조: #607f8d;
  --강조호버: #456674;
  --역글: #fff;
  --테두리: #cddde1;
  --연테두리: #dce7e9;
  --종이: #fafcfc;
  --선택바탕: #dbe8ec;
  --선택안함: rgba(255, 255, 255, .52);
  --호버바탕: #fff;
  --진행바탕: #dce8eb;
  --진행테두리: #c7d9de;
  --진행선: #c1d3d8;
  --진행활성: #688c9a;
  --오류색: #b47d6e;
  --완료색: #668f80;
}

.필사실[data-theme='밤'] {
  --화면: #171f23;
  --장식빛: rgba(91, 123, 131, .12);
  --글: #e0e5df;
  --보조글: #b2bdb9;
  --옅은글: #9dacaa;
  --강조: #b6c8be;
  --강조호버: #d1e0d3;
  --역글: #1e292e;
  --테두리: #3b4b4f;
  --연테두리: #435155;
  --종이: #222c31;
  --선택바탕: #334348;
  --선택안함: #263238;
  --호버바탕: #2e3c42;
  --진행바탕: #28353a;
  --진행테두리: #405056;
  --진행선: #4b5d5f;
  --진행활성: #b8b089;
  --오류색: #d7977f;
  --완료색: #9dbb9d;
}

button { font: inherit; }
.페이지 { max-width: 1100px; margin: 0 auto; padding: 0 34px; }

.상단 {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 84px;
  border-bottom: 1px solid var(--테두리);
}
.상단동작 { display: flex; align-items: center; gap: 20px; }
.브랜드 { display: flex; align-items: center; gap: 11px; }
.브랜드문양 {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: var(--강조);
  color: var(--역글);
  font-family: 'AppleMyungjo', 'Batang', serif;
  font-size: 18px;
  line-height: 1;
}
.브랜드글자 { color: var(--글); font-size: 13px; font-weight: 800; letter-spacing: .12em; }
.브랜드글자 small { margin-left: 12px; color: var(--보조글); font-size: 12px; font-weight: 500; letter-spacing: 0; }
.상단문구 { color: var(--보조글); font-size: 12px; letter-spacing: .03em; }
.설정버튼 { padding: 8px 11px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--보조글); font-size: 12px; cursor: pointer; }
.설정버튼:hover { border-color: var(--강조); color: var(--글); }
.설정버튼 span { margin-left: 5px; font-size: 15px; }
.설정패널 { position: absolute; z-index: 10; top: 72px; right: 0; box-sizing: border-box; width: min(360px, calc(100vw - 36px)); padding: 22px; border: 1px solid var(--테두리); border-radius: 4px; background: var(--종이); box-shadow: 0 15px 36px rgba(0, 0, 0, .18); }
.설정머리 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.설정머리 strong { font-size: 17px; }
.설정닫기 { border: 0; background: none; color: var(--보조글); font-size: 24px; line-height: 1; cursor: pointer; }
.설정패널 fieldset { min-width: 0; margin: 0 0 18px; padding: 0; border: 0; }
.설정패널 legend { margin-bottom: 9px; color: var(--보조글); font-size: 12px; font-weight: 700; }
.테마선택 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.테마버튼 { display: flex; align-items: center; flex-direction: column; gap: 7px; padding: 7px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 12px; cursor: pointer; }
.테마버튼.선택됨, .설정선택 button.선택됨 { border-color: var(--강조); background: var(--선택바탕); }
.테마견본 { display: grid; place-items: center; width: 100%; height: 38px; background: #fff; color: #454037; font-family: 'AppleMyungjo', 'Batang', serif; font-size: 19px; }
.테마견본[data-theme='새벽'] { background: #fafcfc; color: #30444f; }
.테마견본[data-theme='밤'] { background: #222c31; color: #e2e7df; }
.설정선택 { display: flex; gap: 7px; }
.설정선택 button { min-width: 72px; padding: 8px 13px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 12px; cursor: pointer; }
.가장자리선택 input { display: block; width: 100%; margin: 0; accent-color: var(--강조); cursor: pointer; }
.가장자리눈금 { display: flex; justify-content: space-between; margin: 2px 7px 0; }
.가장자리눈금 span { width: 2px; height: 4px; background: var(--테두리); }
.가장자리끝표시 { display: flex; justify-content: space-between; margin-top: 4px; color: var(--옅은글); font-size: 11px; }
.설정안내 { margin: 3px 0 0; color: var(--옅은글); font-size: 11px; }

.소개 {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  padding: 60px 0 58px;
}
.작은제목, .분류, .마침꼬리 {
  color: var(--강조);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}
.작은제목 { display: flex; align-items: center; gap: 9px; margin: 0 0 18px; }
.작은점 { width: 7px; height: 7px; border-radius: 50%; background: var(--강조); }
.소개 h1 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(35px, 4.2vw, 55px);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: 1.38;
}
.소개 h1 em { color: var(--강조); font-style: normal; }
.소개글 { margin: 0 2px 9px 0; color: var(--보조글); font-size: 14px; line-height: 2.05; }

.작업공간 { padding-bottom: 84px; }
.선택머리 { display: flex; justify-content: space-between; align-items: end; gap: 20px; }
.구역번호 { color: var(--강조); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.구역번호 span { padding: 0 5px; color: var(--옅은글); }
.선택머리 h2 { margin: 9px 0 0; font-size: 18px; font-weight: 650; letter-spacing: -.045em; }
.선택안내 { padding-bottom: 2px; color: var(--옅은글); font-size: 12px; }
.글선택 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0 30px; }
.글버튼 {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 66px;
  padding: 0 19px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
  color: var(--글);
  text-align: left;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .2s;
}
.글버튼:hover { transform: translateY(-2px); border-color: var(--강조); background: var(--호버바탕); }
.글버튼.선택됨 { border-color: var(--강조); background: var(--선택바탕); color: var(--글); }
.글번호 { color: var(--옅은글); font-size: 11px; font-weight: 700; letter-spacing: .08em; }
.글제목 { font-size: 14px; font-weight: 650; }
.선택표시 { margin-left: auto; color: var(--강조); font-size: 16px; }
.글버튼.선택됨 .선택표시 { color: var(--글); }

.종이 {
  padding: 30px clamp(24px, 5.4vw, 73px) 27px;
  border: 1px solid var(--연테두리);
  border-radius: 3px;
  background: var(--종이);
  box-shadow: 0 22px 60px rgba(81, 71, 54, .075), 0 2px 7px rgba(81, 71, 54, .035);
}
.종이상단 { display: flex; justify-content: space-between; align-items: center; color: var(--옅은글); font-size: 11px; letter-spacing: .08em; }
.가운데점 { margin: 0 5px; }
.종이장식 { color: var(--강조); font-size: 20px; }
.지문머리 { padding-top: 43px; text-align: center; }
.분류 { margin: 0 0 13px; }
.편표시 { color: var(--옅은글); font-weight: 500; }
.지문머리 h2 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(28px, 3vw, 37px);
  font-weight: 500;
  letter-spacing: -.04em;
}
.출처 { margin: 14px 0 0; color: var(--옅은글); font-size: 12px; }
.출처 a { margin-left: 10px; color: var(--강조); text-underline-offset: 3px; }
.출처 a:hover { color: var(--글); }
.가는선 { width: 42px; height: 1px; margin: 34px auto 0; background: var(--진행선); }
.캔버스영역 { display: flex; justify-content: center; max-width: 930px; margin: 26px auto 0; overflow: hidden; }
#캔버스 { display: block; width: 100%; height: auto; image-rendering: auto; }
.진행판 {
  box-sizing: border-box;
  max-width: 960px;
  margin: 32px auto 0;
  padding: 22px clamp(24px, 5.4vw, 73px) 20px;
  border: 1px solid var(--진행테두리);
  border-radius: 3px;
  background: var(--진행바탕);
}
.진행영역 { max-width: 800px; margin: 0 auto; }
.진행문구 { display: flex; align-items: center; gap: 9px; color: var(--보조글); font-size: 12px; }
.상태표시 { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--옅은글); }
.상태표시.오류 { background: var(--오류색); }
.상태표시.완료 { background: var(--완료색); }
.진행숫자 { margin-left: auto; font-size: 11px; font-variant-numeric: tabular-nums; }
.진행막대 { height: 2px; margin-top: 13px; overflow: hidden; background: var(--진행선); }
.진행막대 span { display: block; height: 100%; background: var(--진행활성); transition: width .2s ease; }
.진행아래 { display: flex; justify-content: space-between; align-items: center; gap: 20px; max-width: 800px; margin: 19px auto 0; color: var(--보조글); font-size: 11px; }
.글자버튼 { padding: 4px 0; border: 0; background: none; color: var(--강조); font-size: 12px; cursor: pointer; }
.글자버튼:hover { color: var(--글); text-decoration: underline; text-underline-offset: 4px; }
.글자버튼 span { margin-left: 4px; font-size: 16px; }
.작은도움 { margin: 21px 0 0; color: var(--옅은글); font-size: 12px; text-align: center; }

.마침 {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 800px;
  margin: 23px auto 0;
  padding: 23px 0 0;
  border-top: 1px solid var(--진행선);
}
.마침문양 { align-self: flex-start; color: var(--강조); font-size: 25px; }
.마침꼬리 { margin: 0 0 10px; }
.마침내용 { min-width: 0; }
.마침 h3 { margin: 0; font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif; font-size: 20px; font-weight: 500; line-height: 1.55; }
.마침설명 { margin: 10px 0 0; color: var(--보조글); font-size: 12px; }
.마침통계 { display: flex; flex-wrap: wrap; gap: 12px 26px; margin: 24px 0 0; padding: 15px 0 0; border-top: 1px solid var(--진행선); }
.마침통계 div { display: flex; flex-direction: column; gap: 5px; }
.마침통계 dt { color: var(--옅은글); font-size: 11px; }
.마침통계 dd { margin: 0; color: var(--보조글); font-size: 12px; font-variant-numeric: tabular-nums; }
.마침동작 { display: flex; flex-direction: column; align-items: center; gap: 9px; margin-left: auto; }
.다음안내 { max-width: 180px; color: var(--보조글); font-size: 11px; text-align: center; line-height: 1.5; }
.주버튼 { min-width: 132px; padding: 11px 14px; border: 1px solid var(--강조); border-radius: 2px; background: var(--강조); color: var(--역글); font-size: 12px; cursor: pointer; }
.주버튼:hover { background: var(--강조호버); }
.주버튼 span { margin-left: 12px; }
button:focus-visible { outline: 2px solid var(--강조); outline-offset: 3px; }
.바닥 { display: flex; justify-content: space-between; padding: 23px 0 34px; border-top: 1px solid var(--테두리); color: var(--옅은글); font-size: 11px; letter-spacing: .07em; }

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
