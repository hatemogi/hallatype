<template>
  <main class="필사실 도움말화면" :data-theme="테마">
    <div class="도움말안쪽">
      <header class="도움말상단">
        <a class="브랜드" href="#practice" aria-label="필사 화면으로 돌아가기">
          <GeulsumMark :key="`문양-${테마}`" class="브랜드문양" />
          <span class="브랜드글자"><GeulsumTitle :key="`타이틀-${테마}`" class="브랜드타이틀" :src="연필타이틀" :width="1736" :height="906" :gap-reduction="55" /><small class="공식주소">dailytyping.com</small></span>
        </a>
        <a class="돌아가기" href="#practice">필사로 돌아가기 <span aria-hidden="true">↗</span></a>
      </header>

      <div class="도움말머리">
        <p>글숨 사용 안내</p>
        <h1>도움말</h1>
        <span>한 편씩, 편한 속도로 따라 쓰세요.</span>
      </div>

      <section class="안내격자" aria-label="필사 사용법">
        <article>
          <span class="순서">01</span>
          <h2>글 고르기</h2>
          <p>왼쪽에서 주제를 고르고 원하는 글을 선택하세요.</p>
        </article>
        <article>
          <span class="순서">02</span>
          <h2>따라 쓰기</h2>
          <p>화면의 문장을 보며 키보드로 입력하세요. 오타가 나면 같은 자리에서 올바른 글자를 다시 입력하면 됩니다.</p>
        </article>
        <article>
          <span class="순서">03</span>
          <h2>이어 쓰기와 기록</h2>
          <p>입력하던 글은 이 브라우저에 저장됩니다. 글을 마치면 정타율과 입력 리듬을 보고, 최근 기록에서 다시 살펴볼 수 있습니다.</p>
        </article>
        <article>
          <span class="순서">04</span>
          <h2>내게 맞게 설정하기</h2>
          <p>환경설정에서 색상 테마와 글자 크기를 바꿀 수 있습니다. 마음에 드는 글은 별을 눌러 즐겨찾기에 모아 두세요.</p>
        </article>
      </section>

      <section class="키보드안내" aria-labelledby="키보드제목">
        <div class="키보드머리">
          <div>
            <p>빠르게 사용하기</p>
            <h2 id="키보드제목">키보드 단축키</h2>
          </div>
          <span>Mac에서는 Option(⌥) 키가 Alt입니다.</span>
        </div>
        <dl>
          <div><dt><kbd>Alt</kbd> + <kbd>G</kbd></dt><dd>주제 고르기</dd></div>
          <div><dt><kbd>Alt</kbd> + <kbd>S</kbd></dt><dd>환경설정</dd></div>
          <div><dt><kbd>Alt</kbd> + <kbd>R</kbd></dt><dd>이 글 다시 쓰기</dd></div>
          <div><dt><kbd>Alt</kbd> + <kbd>F</kbd></dt><dd>이 글 즐겨찾기</dd></div>
          <div><dt><kbd>Alt</kbd> + <kbd>H</kbd></dt><dd>도움말</dd></div>
          <div><dt><kbd>Enter</kbd></dt><dd>한 편을 마친 뒤 다음 지문</dd></div>
        </dl>
        <p class="키보드기본">Tab으로 이동 · Enter 또는 Space로 선택 · Esc로 열린 창 닫기</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import 연필타이틀 from '@/assets/geulsum-title-pencil-spaced.png';
import GeulsumMark from '@/components/GeulsumMark.vue';
import GeulsumTitle from '@/components/GeulsumTitle.vue';
import { 필사설정읽기, type 필사테마 } from '@/practice-settings';

const 테마 = ref<필사테마>(필사설정읽기().테마);

onMounted(() => {
  테마.value = 필사설정읽기().테마;
  document.title = '글숨 · 도움말';
});
</script>

<style scoped>
:global(body:has(.도움말화면)) { margin: 0; }
.도움말화면 { min-height: 100dvh; text-align: left; }
.도움말안쪽 { max-width: 1100px; margin: 0 auto; padding: 0 34px 54px; }
.도움말상단 { display: flex; align-items: center; justify-content: space-between; height: 62px; border-bottom: 1px solid var(--테두리); }
.브랜드 { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.브랜드문양 { width: 27px; height: 27px; --글숨문양색: var(--글); --글숨문양획색: var(--화면); }
.브랜드글자 { display: flex; align-items: center; gap: 9px; color: var(--글); }
.브랜드타이틀 { display: block; width: 49px; height: auto; color: var(--글); }
.브랜드글자 small { color: var(--글); font-size: 14px; }
.돌아가기 { color: var(--보조글); font-size: 13px; text-decoration: none; }
.돌아가기:hover { color: var(--글); text-decoration: underline; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
.도움말머리 { padding: clamp(28px, 5dvh, 48px) 0 27px; }
.도움말머리 p, .키보드머리 p { margin: 0 0 8px; color: var(--보조글); font-size: 13px; font-weight: 700; letter-spacing: .08em; }
.도움말머리 h1 { margin: 0; color: var(--글); font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif; font-size: clamp(29px, 3.2vw, 38px); font-weight: 500; }
.도움말머리 > span { display: block; margin-top: 12px; color: var(--보조글); font-size: 14px; }
.안내격자 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.안내격자 article { min-width: 0; padding: 22px 24px; border: 1px solid var(--연테두리); border-radius: 3px; background: var(--종이); }
.순서 { color: var(--보조글); font-size: 12px; font-variant-numeric: tabular-nums; }
.안내격자 h2 { margin: 13px 0 8px; color: var(--글); font-size: 18px; }
.안내격자 p { margin: 0; color: var(--보조글); font-size: 14px; line-height: 1.8; word-break: keep-all; }
.키보드안내 { margin-top: 38px; padding-top: 24px; border-top: 1px solid var(--테두리); }
.키보드머리 { display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.키보드머리 h2 { margin: 0; color: var(--글); font-size: 20px; }
.키보드머리 > span { color: var(--보조글); font-size: 12px; }
.키보드안내 dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; margin: 18px 0 0; }
.키보드안내 dl div { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; border-bottom: 1px solid var(--연테두리); }
.키보드안내 dt { flex: none; color: var(--글); font-size: 13px; white-space: nowrap; }
.키보드안내 dd { margin: 0; color: var(--보조글); font-size: 13px; text-align: right; }
kbd { display: inline-block; min-width: 18px; padding: 4px 6px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--종이); color: var(--글); font: inherit; text-align: center; }
.키보드기본 { margin: 18px 0 0; color: var(--보조글); font-size: 12px; line-height: 1.7; }
@media (max-width: 850px) {
  .도움말안쪽 { padding-right: 14px; padding-left: 14px; }
  .도움말상단 { height: 56px; }
}
@media (max-width: 700px) {
  .도움말안쪽 { padding-bottom: 35px; }
  .브랜드글자 small { display: none; }
  .안내격자, .키보드안내 dl { grid-template-columns: 1fr; }
  .안내격자 article { padding: 18px; }
  .키보드머리 { align-items: start; flex-direction: column; }
}
</style>
