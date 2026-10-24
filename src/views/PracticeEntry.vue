<template>
  <Home v-if="필사시작됨" />
  <main v-else class="첫화면" :data-theme="테마">
    <div class="첫화면안쪽">
      <header class="첫화면상단">
        <div class="첫화면브랜드"><GeulsumMark /><span class="도메인">DAILYTYPING.COM</span></div>
        <span class="상단장식" aria-hidden="true">✳</span>
      </header>

      <section class="소개" aria-labelledby="서비스이름">
        <span class="소개장식" aria-hidden="true">✳</span>
        <h1 id="서비스이름">글숨</h1>
        <p class="슬로건">한 글자씩, 마음을 고르다.</p>
        <div class="구분선" aria-hidden="true"></div>
        <p class="설명">키보드를 두드릴 핑계.<br>좋은 문장을 따라 쓰는 시간.</p>
        <a ref="시작버튼" href="#practice" class="시작버튼">필사 시작하기 <span aria-hidden="true">→</span></a>
      </section>

      <footer class="첫화면하단"><span>천천히, 나의 속도로</span><span>글숨 · DAILYTYPING</span></footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { 필사설정읽기, type 필사테마 } from '@/practice-settings';
import GeulsumMark from '@/components/GeulsumMark.vue';
import Home from './Home.vue';

const 필사시작됨 = ref(window.location.hash === '#practice');
const 테마 = ref<필사테마>(필사설정읽기().테마);
const 시작버튼 = ref<HTMLAnchorElement | null>(null);

function 첫화면엔터(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.defaultPrevented || event.repeat || event.isComposing ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || 필사시작됨.value) { return; }
  if (event.target instanceof Element &&
      event.target.closest('a, button, input, textarea, select, [contenteditable]')) { return; }
  시작버튼.value?.click();
}

function 저장된테마반영() {
  테마.value = 필사설정읽기().테마;
}

function 주소반영() {
  필사시작됨.value = window.location.hash === '#practice';
  if (!필사시작됨.value) {
    저장된테마반영();
    nextTick(() => { document.title = '글숨 · 한 글자씩, 마음을 고르다.'; });
  }
}

onMounted(() => {
  저장된테마반영();
  document.title = 필사시작됨.value ? '글숨 · 한글 타이핑 필사' : '글숨 · 한 글자씩, 마음을 고르다.';
  window.addEventListener('hashchange', 주소반영);
  window.addEventListener('storage', 저장된테마반영);
  window.addEventListener('keydown', 첫화면엔터);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', 주소반영);
  window.removeEventListener('storage', 저장된테마반영);
  window.removeEventListener('keydown', 첫화면엔터);
  document.title = window.location.pathname.endsWith('/masks')
    ? '글숨 · 마스크 편집기' : '글숨 · 글꼴 편집기';
});
</script>

<style scoped>
:global(body:has(.첫화면)) { margin: 0; }
.첫화면 {
  --첫화면중심: #fffdf8;
  --첫화면중간: #f7f3eb;
  --첫화면끝: #eee8db;
  --글: #38372f;
  --보조글: #5f5b50;
  --옅은글: #69665c;
  --강조: #7e715d;
  --강조호버: #665b49;
  --역글: #fff;
  --진행선: #d9d2c5;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  background: radial-gradient(circle at 50% 42%, var(--첫화면중심) 0, var(--첫화면중간) 58%, var(--첫화면끝) 100%);
  color: var(--글);
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.첫화면[data-theme='새벽'] {
  --첫화면중심: #fafcfc;
  --첫화면중간: #e9f0f2;
  --첫화면끝: #dce7e9;
  --글: #30444f;
  --보조글: #45606c;
  --옅은글: #536974;
  --강조: #587684;
  --강조호버: #456674;
  --진행선: #c1d3d8;
}
.첫화면[data-theme='밤'] {
  --첫화면중심: #222c31;
  --첫화면중간: #1c262a;
  --첫화면끝: #171f23;
  --글: #e0e5df;
  --보조글: #b2bdb9;
  --옅은글: #9dacaa;
  --강조: #b6c8be;
  --강조호버: #d1e0d3;
  --역글: #1e292e;
  --진행선: #4b5d5f;
}
.첫화면[data-theme='벚꽃'] {
  --첫화면중심: #fff9fa;
  --첫화면중간: #f7e9ec;
  --첫화면끝: #edd8df;
  --글: #4b303b;
  --보조글: #654651;
  --옅은글: #70515d;
  --강조: #8b3d5a;
  --강조호버: #723047;
  --진행선: #dbbcc6;
}
.첫화면[data-theme='숲'] {
  --첫화면중심: #19392f;
  --첫화면중간: #143229;
  --첫화면끝: #102c25;
  --글: #e6efe4;
  --보조글: #bfd4c2;
  --옅은글: #aac4ae;
  --강조: #b6d99e;
  --강조호버: #d1e8b9;
  --역글: #173127;
  --진행선: #64816a;
}
.첫화면[data-theme='라벤더'] {
  --첫화면중심: #fcfaff;
  --첫화면중간: #eee9f5;
  --첫화면끝: #ded5ea;
  --글: #3b3154;
  --보조글: #57496f;
  --옅은글: #665878;
  --강조: #675184;
  --강조호버: #524069;
  --진행선: #c9b9dc;
}
.첫화면[data-theme='매트릭스'] {
  --첫화면중심: #08190e;
  --첫화면중간: #07140c;
  --첫화면끝: #061009;
  --글: #b2f7b9;
  --보조글: #8acb92;
  --옅은글: #75aa7d;
  --강조: #63f583;
  --강조호버: #a0ffb4;
  --역글: #061009;
  --진행선: #34603d;
}
.첫화면[data-theme='PC통신'] {
  --첫화면중심: #102287;
  --첫화면중간: #0c1c76;
  --첫화면끝: #081666;
  --글: #fff;
  --보조글: #dbe5ff;
  --옅은글: #bbcdfa;
  --강조: #fff;
  --강조호버: #dbe5ff;
  --역글: #102287;
  --진행선: #6885dc;
}
.첫화면[data-theme='호박색 모니터'] {
  --첫화면중심: #1b1209;
  --첫화면중간: #171007;
  --첫화면끝: #120e08;
  --글: #f8d79a;
  --보조글: #cfaa70;
  --옅은글: #ab8656;
  --강조: #ffbc55;
  --강조호버: #ffd98b;
  --역글: #231306;
  --진행선: #654522;
}
.첫화면안쪽 {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(100%, 1200px);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 34px clamp(24px, 5vw, 66px) 28px;
}
.첫화면상단, .첫화면하단 { display: flex; justify-content: space-between; align-items: center; }
.첫화면브랜드 { display: flex; align-items: center; gap: 11px; }
.도메인 { color: var(--보조글); font-size: 11px; font-weight: 700; letter-spacing: .23em; }
.상단장식 { color: var(--강조); font-size: 20px; }
.소개 {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0 76px;
  text-align: center;
}
.소개장식 { margin-bottom: 20px; color: var(--강조); font-size: 26px; }
.소개 h1 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(72px, 11vw, 120px);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -.09em;
}
.슬로건 {
  margin: 23px 0 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(20px, 3vw, 30px);
  line-height: 1.55;
  letter-spacing: -.045em;
}
.구분선 { width: 42px; height: 1px; margin: 35px 0; background: var(--진행선); }
.설명 { margin: 0; color: var(--보조글); font-size: 16px; line-height: 1.9; word-break: keep-all; }
.시작버튼 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 56px;
  margin-top: 40px;
  padding: 0 25px;
  border: 1px solid var(--강조);
  border-radius: 3px;
  background: var(--강조);
  color: var(--역글);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background-color .2s ease, transform .2s ease;
}
.시작버튼:hover { background: var(--강조호버); transform: translateY(-2px); }
.시작버튼:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
.시작버튼 span { font-size: 18px; font-weight: 400; }
.첫화면하단 { gap: 20px; color: var(--옅은글); font-size: 11px; letter-spacing: .04em; }
.첫화면:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .소개 h1,
.첫화면:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .슬로건 {
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 700;
  letter-spacing: -.04em;
}
.첫화면:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .시작버튼 { border-radius: 0; }
@media (max-width: 600px) {
  .첫화면안쪽 { padding: 22px 22px 20px; }
  .소개 { padding-bottom: 48px; }
  .소개장식 { margin-bottom: 13px; }
  .슬로건 { margin-top: 17px; }
  .구분선 { margin: 28px 0; }
  .설명 { font-size: 15px; }
  .시작버튼 { margin-top: 34px; }
  .첫화면하단 { font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .시작버튼 { transition: none; }
}
</style>
