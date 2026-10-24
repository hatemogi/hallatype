<template>
  <main class="필사실 최근기록" :data-theme="테마">
    <div class="최근안쪽">
      <header class="최근상단">
        <a class="브랜드" href="#practice" aria-label="필사 화면으로 돌아가기">
          <GeulsumMark class="브랜드문양" />
          <span>글숨 <small>한글 타이핑 필사</small></span>
        </a>
        <a class="돌아가기" href="#practice">필사로 돌아가기 <span aria-hidden="true">↗</span></a>
      </header>

      <section class="최근본문" aria-labelledby="최근제목">
        <div class="최근머리">
          <p>나의 필사 기록</p>
          <h1 id="최근제목">최근 완성한 글</h1>
          <span>{{기록들.length ? `최근 ${기록들.length}편` : '아직 기록이 없어요'}}</span>
        </div>

        <div v-if="기록들.length" class="기록격자">
          <article v-for="기록 in 기록들" :key="기록.시도ID" class="기록카드">
            <p class="기록메타"><span class="기록주제">{{기록.테마}}</span><time :datetime="기록.완료시각">{{기록.완료일시}}</time></p>
            <h2><a :href="`#practice?passage=${기록.지문.id}`" :aria-label="`${기록.테마}의 ${기록.지문.제목} 다시 입력하기`">{{기록.지문.제목}} <span aria-hidden="true">↗</span></a></h2>
            <div class="기록그래프머리"><span>이 글의 입력 리듬</span><span>정타율 × 속도</span></div>
            <div class="리듬그래프" role="img" :aria-label="`${기록.지문.제목}의 글 전체 진행 위치에 따른 정타와 상대적인 입력 속도. 오타는 다른 색으로 표시됩니다.`">
              <span v-for="(막대, 순서) in 기록.리듬막대들" :key="순서" class="리듬칸" aria-hidden="true">
                <span v-if="막대" class="리듬막대" :class="{ 오타: 막대.오타 }" :style="{ height: `${막대.높이}%` }"></span>
              </span>
            </div>
            <dl class="마침통계" :aria-label="`${기록.지문.제목} 필사 기록`">
              <div><dt>이번 정타율</dt><dd>{{기록.정타율}}% ({{기록.정타수}}/{{기록.전체타수}})</dd></div>
              <div><dt>걸린 시간</dt><dd>{{기록.걸린시간}}</dd></div>
            </dl>
          </article>
        </div>
        <div v-else class="빈기록">
          <p>지문 한 편을 마치면 입력 리듬과 기록을 이곳에서 다시 볼 수 있어요.</p>
          <a href="#practice">필사 시작하기 <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GeulsumMark from '@/components/GeulsumMark.vue';
import { 필사설정읽기, type 필사테마 } from '@/practice-settings';
import { 진행작업읽기, 시도목록 } from '@/practice-progress';
import { 최근완료기록들, type 최근완료기록 } from '@/practice-recent';

const 테마 = ref<필사테마>(필사설정읽기().테마);
const 기록들 = ref<최근완료기록[]>([]);

onMounted(() => {
  테마.value = 필사설정읽기().테마;
  기록들.value = 최근완료기록들(시도목록(진행작업읽기()));
  document.title = '글숨 · 최근 완성한 글';
});
</script>

<style scoped>
:global(body:has(.최근기록)) { margin: 0; }
.최근기록 { min-height: 100dvh; text-align: left; }
.최근기록[data-theme='정원'] { --강조: #a13f0d; }
.최근기록[data-theme='서가'] { --강조: #e4af5d; }
.최근안쪽 { box-sizing: border-box; width: min(100%, 1100px); margin: 0 auto; padding: 0 34px 34px; }
.최근상단 { display: flex; align-items: center; justify-content: space-between; min-height: 62px; border-bottom: 1px solid var(--테두리); }
.브랜드 { display: flex; align-items: center; gap: 11px; color: var(--글); font-size: 13px; font-weight: 800; letter-spacing: .12em; text-decoration: none; }
.브랜드 small { margin-left: 12px; color: var(--보조글); font-size: 12px; font-weight: 500; letter-spacing: 0; }
.돌아가기 { color: var(--보조글); font-size: 12px; text-decoration: none; }
.돌아가기:hover, .기록카드 h2 a:hover { color: var(--강조); text-decoration: underline; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
.최근본문 { padding-top: clamp(23px, 4dvh, 42px); }
.최근머리 { position: relative; margin-bottom: 24px; }
.최근머리 p { margin: 0 0 8px; color: var(--강조); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.최근머리 h1 { margin: 0; color: var(--글); font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif; font-size: clamp(27px, 3.2vw, 36px); font-weight: 500; letter-spacing: -.04em; }
.최근머리 > span { position: absolute; right: 0; bottom: 4px; color: var(--보조글); font-size: 12px; }
.기록격자 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.기록카드 { min-width: 0; padding: clamp(16px, 2vw, 23px); border: 1px solid var(--진행테두리); border-radius: 3px; background: var(--진행바탕); }
.기록메타 { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3px 12px; margin: 0 0 6px; font-size: 11px; }
.기록주제 { color: var(--강조); font-weight: 700; }
.기록메타 time { color: var(--보조글); font-variant-numeric: tabular-nums; }
.기록카드 h2 { margin: 0 0 19px; font-size: 18px; font-weight: 600; }
.기록카드 h2 a { color: var(--글); text-decoration: none; }
.기록카드 h2 span { margin-left: 4px; color: var(--강조); font-size: 14px; }
.기록그래프머리 { display: flex; justify-content: space-between; gap: 12px; color: var(--보조글); font-size: 11px; }
.리듬그래프 { display: grid; grid-template-columns: repeat(100, minmax(0, 1fr)); align-items: end; gap: 1px; height: 38px; margin-top: 12px; border-bottom: 1px solid var(--진행선); }
.리듬칸 { position: relative; height: 100%; min-width: 0; }
.리듬막대 { position: absolute; right: 0; bottom: 0; left: 0; display: block; background: var(--진행활성); }
.리듬막대.오타 { background: var(--오류색); }
.최근기록[data-theme='한지'] .리듬막대:not(.오타),
.최근기록[data-theme='새벽'] .리듬막대:not(.오타),
.최근기록[data-theme='항구'] .리듬막대:not(.오타),
.최근기록[data-theme='모과'] .리듬막대:not(.오타) { background: var(--강조); }
.마침통계 { display: flex; flex-wrap: wrap; gap: 12px 26px; margin: 17px 0 0; padding: 14px 0 0; border-top: 1px solid var(--진행선); }
.마침통계 div { display: flex; flex-direction: column; gap: 5px; }
.마침통계 dt { color: var(--옅은글); font-size: 11px; }
.마침통계 dd { margin: 0; color: var(--보조글); font-size: 12px; font-variant-numeric: tabular-nums; }
.빈기록 { padding: 35px 26px; border: 1px solid var(--진행테두리); border-radius: 3px; background: var(--진행바탕); color: var(--보조글); font-size: 13px; text-align: center; }
.빈기록 p { margin: 0 0 18px; }
.빈기록 a { color: var(--강조); font-weight: 700; }
@media (max-width: 700px) {
  .최근안쪽 { padding: 0 16px 24px; }
  .브랜드 small { display: none; }
  .최근머리 { margin-bottom: 18px; }
  .기록격자 { grid-template-columns: 1fr; gap: 10px; }
  .기록카드 { padding: 15px; }
  .기록카드 h2 { margin-bottom: 12px; }
}
</style>
