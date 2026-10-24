<template>
  <main class="필사실" :data-theme="설정.테마">
    <div class="페이지">
      <header class="상단">
        <a class="브랜드" href="#" aria-label="글숨 첫 화면으로 이동">
          <GeulsumMark class="브랜드문양" />
          <span class="브랜드글자">글숨 <small>한글 필사</small></span>
        </a>
        <div class="상단동작">
          <span class="상단문구">한 글자씩, 마음을 고르다.</span>
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

      <section class="작업공간" aria-label="필사할 글">
        <div class="모바일선택줄">
          <div><span>선택한 글</span><strong>{{글테마}} · {{오늘지문.제목}}</strong></div>
          <button type="button" aria-controls="지문선택창" :aria-expanded="목록열림" @click="목록열기">글 고르기 <span aria-hidden="true">⌄</span></button>
        </div>
        <div v-if="모바일보기 && 목록열림" class="목록가림막" @click="목록닫기"></div>
        <aside v-show="!모바일보기 || 목록열림" id="지문선택창" class="선택패널"
          :role="모바일보기 ? 'dialog' : undefined" :aria-modal="모바일보기 ? 'true' : undefined"
          aria-label="입력할 글 고르기">
          <div class="선택머리">
            <div><span class="구역번호">필사할 글</span><h2>입력할 글 고르기</h2></div>
            <button type="button" class="목록닫기" aria-label="글 선택창 닫기" @click="목록닫기">×</button>
          </div>
          <div class="글테마선택" role="group" aria-label="지문 테마 선택">
            <button v-for="테마 in 글테마선택지" :key="테마" type="button"
              :class="{ 선택됨: 글테마 === 테마 }" :aria-pressed="글테마 === 테마"
              @click="글테마바꾸기(테마, $event)">{{테마}}</button>
          </div>
          <section class="지문서랍" :aria-label="`${글테마} 지문 목록`">
            <h3>전체 글 <span>{{현재지문들.length}}편</span></h3>
            <div class="글목록" role="group" :aria-label="`${글테마} 지문 선택`">
              <button v-for="지문 in 현재지문들" :key="지문.id" type="button"
                :class="{ 선택됨: 오늘지문.id === 지문.id }" :aria-pressed="오늘지문.id === 지문.id"
                @click="지문선택(지문, $event)">
                <strong>{{지문.제목}}</strong>
                <span>{{지문.주제}} · <em :class="{ 완료: 지문상태(지문) === '완료' }">{{지문상태(지문)}}</em><small v-if="지문상태(지문) === '완료'" class="최고정타율"> · 최고 {{지문최고(지문)}}%</small></span>
              </button>
            </div>
          </section>
        </aside>

        <div class="필사패널">
        <article class="종이" aria-labelledby="지문제목">
          <div class="종이상단">
            <span>필사 노트 <span class="가운데점">·</span> {{오늘날짜}}</span>
            <span class="종이장식" aria-hidden="true">✳</span>
          </div>
          <div class="지문머리">
            <p class="분류">선택한 글 · {{오늘지문.주제}}</p>
            <h2 id="지문제목">{{오늘지문.제목}}</h2>
            <p class="출처" v-if="오늘지문.원문URL">
              <a :href="오늘지문.원문URL" target="_blank" rel="noopener noreferrer">{{오늘지문.저자}} · 위키문헌 원문 ↗</a>
            </p>
            <p class="출처" v-else>{{글테마}} · 창작 지문</p>
          </div>
          <div class="가는선" aria-hidden="true"></div>

          <div class="캔버스영역">
            <canvas id="캔버스" width="1286" height="210"
              :aria-label="`${오늘지문.제목} 필사 지문. 키보드로 따라 입력하세요.`"></canvas>
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
              aria-valuemax="100" :aria-label="`${오늘지문.제목} 필사 진행률`">
              <span :style="{ width: `${진행률}%` }"></span>
            </div>
            <p v-if="기록오류" class="기록안내" role="alert">진행 기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</p>
            <p v-else-if="이어쓰기복원됨" class="기록안내">이 브라우저에 저장된 지점부터 이어 씁니다.</p>
          </div>

          <div v-if="결과화면보이기" class="마침">
            <div class="마침내용">
              <p class="마침꼬리">한 편을 마쳤어요</p>
              <dl class="마침통계" aria-label="이번 필사 기록">
                <div><dt>걸린 시간</dt><dd>{{걸린시간}}</dd></div>
                <div><dt>이번 정타율</dt><dd>{{정타율}}% ({{정타수}}/{{총입력타수}})</dd></div>
                <div><dt>분당 정타</dt><dd>{{분당타수}}/분</dd></div>
              </dl>
              <p v-if="종전최고정타율 !== null" class="정타율비교">
                종전 최고 {{종전최고표시}}% 대비
                <strong>{{정타율차이표시}}%p</strong>
              </p>
            </div>
            <div class="마침동작">
              <button v-if="다음편" type="button" class="주버튼" @click="지문선택(다음편)">다음 편 입력 <span aria-hidden="true">→</span></button>
              <button v-if="다음편" type="button" class="글자버튼" @click="다시쓰기">이 글 다시 쓰기 <span aria-hidden="true">↺</span></button>
              <button v-else type="button" class="주버튼" @click="다시쓰기">이 글 다시 쓰기 <span aria-hidden="true">↺</span></button>
            </div>
          </div>

          <div v-else class="진행아래">
            <span>띄어쓰기와 줄바꿈은 건너뛰어도 괜찮아요.</span>
            <button type="button" class="글자버튼" @click="다시쓰기">처음부터 다시 쓰기 <span aria-hidden="true">↺</span></button>
          </div>
        </section>

        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import GeulsumMark from '@/components/GeulsumMark.vue';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 날짜키, 지문선택읽기, 지문선택저장, 테마별지문들,
  type 연습지문, type 지문테마 } from '@/practice-passages';
import { 본문버전, 브라우저저장소, 시도목록, 시도시작, 시도완료, 시도중단, 입력묶음,
  지문입력상태, 지문최고정타율, 정타율, 정타율표시,
  진행작업읽기, 진행작업저장, 작업합치기, type 입력키, type 진행작업,
  type 필사시도, type 이어쓰기원본 } from '@/practice-progress';
import { 기본필사설정, 필사설정, 필사설정읽기, 필사설정저장,
  필사테마, 지문크기, 안티앨리어싱단계, 단계별안티앨리어싱강도, 필사팔레트들 } from '@/practice-settings';

const 테마선택지: Array<{ 이름: 필사테마 }> = [
  { 이름: '한지' }, { 이름: '새벽' }, { 이름: '밤' }, { 이름: '매트릭스' }, { 이름: 'PC통신' },
  { 이름: '호박색 모니터' },
];
const 글자크기선택지: 지문크기[] = ['작게', '보통', '크게'];
const 가장자리단계이름 = ['선명하게', '조금 선명하게', '보통', '조금 부드럽게', '부드럽게'];
const 글테마선택지: 지문테마[] = ['산문', '자기계발', '명상', '자기확언', '생활교양', '요리레시피',
  '메밀꽃 필 무렵', '봄봄'];

export default defineComponent({
  components: { GeulsumMark },
  data() {
    const 선택 = 지문선택읽기();
    return {
      오늘날짜: 날짜키(new Date()),
      오늘지문: 선택.지문,
      글테마: 선택.테마,
      글테마선택지,
      테마선택지,
      글자크기선택지,
      가장자리단계이름,
      설정: { ...기본필사설정 } as 필사설정,
      설정열림: false,
      모바일보기: typeof window !== 'undefined' && window.innerWidth <= 850,
      목록열림: false,
      날짜확인타이머: null as ReturnType<typeof setInterval> | null,
      현재한줄칸수: 0,
      진행률: 0,
      입력상태: '대기' as '대기' | '진행' | '오타' | '정정',
      결과화면보이기: false,
      시작시각: null as number | null,
      완료초: 0,
      총입력타수: 0,
      정타수: 0,
      분당타수: 0,
      종전최고정타율: null as number | null,
      기록들: [] as 진행작업[],
      시도ID: null as string | null,
      이어쓰기원본: null as 이어쓰기원본 | null,
      다음기록순서: 0,
      미기록입력: [] as 입력키[],
      미저장작업: [] as 진행작업[],
      기록타이머: null as ReturnType<typeof setTimeout> | null,
      기록오류: false,
      이어쓰기복원됨: false,
      그림판: null as 그림판틀 | null,
      본문: null as 따라그리기틀 | null,
    };
  },
  methods: {
    목록열기() {
      this.목록열림 = true;
      this.$nextTick(() => document.querySelector<HTMLElement>('.목록닫기')?.focus());
    },
    목록닫기() {
      const 열려있음 = this.목록열림;
      this.목록열림 = false;
      if (열려있음) { (document.activeElement as HTMLElement | null)?.blur(); }
    },
    다른탭기록반영(event: StorageEvent) {
      if (event.key?.startsWith('hallatype:progress:v2:op:')) {
        this.기록들 = 작업합치기(this.기록들, 진행작업읽기());
      }
    },
    저장대기(작업: 진행작업) {
      this.미저장작업.push(작업);
      this.밀린기록저장();
    },
    밀린기록저장() {
      const 저장소 = 브라우저저장소();
      while (this.미저장작업.length) {
        const 작업 = this.미저장작업[0];
        if (!진행작업저장(작업, 저장소)) { this.기록오류 = true; return; }
        this.기록들 = 작업합치기(this.기록들, [작업]);
        this.미저장작업.shift();
      }
      this.기록오류 = false;
    },
    입력기록저장() {
      if (this.기록타이머 !== null) { clearTimeout(this.기록타이머); this.기록타이머 = null; }
      if (!this.시도ID || !this.미기록입력.length) { this.밀린기록저장(); return; }
      const 걸린밀리초 = Math.max(0, performance.now() - (this.시작시각 ?? performance.now()));
      this.저장대기(입력묶음(this.시도ID, this.다음기록순서++, this.미기록입력, 걸린밀리초));
      this.미기록입력 = [];
    },
    입력기록추가(키: 입력키) {
      this.미기록입력.push(키);
      if (this.미기록입력.length >= 20) { this.입력기록저장(); }
      else if (this.기록타이머 === null) {
        this.기록타이머 = setTimeout(() => this.입력기록저장(), 2000);
      }
    },
    복원할시도(): 필사시도 | undefined {
      const 버전 = 본문버전(this.오늘지문.본문);
      return this.시도들
        .filter((시도) => 시도.시작.passageId === this.오늘지문.id &&
          시도.시작.contentVersion === 버전 && 시도.복원가능 && !시도.완료 &&
          !시도.중단됨 && 시도.입력들.length)
        .sort((a, b) => b.마지막시각.localeCompare(a.마지막시각) ||
          b.시작.attemptId.localeCompare(a.시작.attemptId))[0];
    },
    완료한시도(): 필사시도 | undefined {
      const 버전 = 본문버전(this.오늘지문.본문);
      return this.시도들
        .filter((시도) => 시도.시작.passageId === this.오늘지문.id &&
          시도.시작.contentVersion === 버전 && 시도.복원가능 && !!시도.완료)
        .sort((a, b) => b.완료!.at.localeCompare(a.완료!.at))[0];
    },
    지문상태(지문: 연습지문): string {
      return 지문입력상태(this.시도들, 지문.id, 본문버전(지문.본문));
    },
    지문최고(지문: 연습지문): string {
      const 최고 = 지문최고정타율(this.시도들, 지문.id, 본문버전(지문.본문));
      return 최고 === null ? '0.00' : 정타율표시(최고);
    },
    글테마바꾸기(테마: 지문테마, event?: MouseEvent) {
      if (!this.목록열림) { (event?.currentTarget as HTMLElement | undefined)?.blur(); }
      if (테마 === this.글테마) { return; }
      this.입력기록저장();
      this.글테마 = 테마;
      this.오늘지문 = 테마별지문들[테마][0];
      지문선택저장(테마, this.오늘지문.id);
      this.reset();
    },
    지문선택(지문: 연습지문, event?: MouseEvent) {
      (event?.currentTarget as HTMLElement | undefined)?.blur();
      this.목록닫기();
      if (지문.id === this.오늘지문.id) { return; }
      this.입력기록저장();
      this.오늘지문 = 지문;
      지문선택저장(this.글테마, 지문.id);
      this.reset();
    },
    날짜변경확인() {
      const 오늘날짜 = 날짜키(new Date());
      if (오늘날짜 === this.오늘날짜) { return; }
      this.입력기록저장();
      this.오늘날짜 = 오늘날짜;
      this.reset();
    },
    다시쓰기() {
      this.입력기록저장();
      if (!this.결과화면보이기) {
        const 기록지도 = new Map(this.시도들.map((시도) => [시도.시작.attemptId, 시도]));
        const 확인 = new Set<string>();
        let 중단할ID = this.시도ID ?? this.이어쓰기원본?.attemptId;
        while (중단할ID && !확인.has(중단할ID)) {
          확인.add(중단할ID);
          const 시도 = 기록지도.get(중단할ID);
          if (시도 && !시도.완료 && !시도.중단됨) { this.저장대기(시도중단(중단할ID)); }
          중단할ID = 시도?.시작.continuedFrom?.attemptId;
        }
      }
      this.reset(true);
    },
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
      this.현재한줄칸수 = this.한줄칸수();
      this.그림판?.보기설정(팔레트, this.현재한줄칸수,
        this.설정.커서깜빡임);
    },
    한줄칸수(): number {
      const 너비 = document.querySelector('.캔버스영역')?.clientWidth ?? window.innerWidth - 80;
      const 크기별기준: Record<지문크기, number> = window.innerWidth <= 850
        ? { 작게: 8, 보통: 10, 크게: 12 }
        : { 작게: 10, 보통: 12, 크게: 14 };
      const 기준크기 = 크기별기준[this.설정.글자크기];
      return Math.max(22, Math.min(80, Math.floor(너비 / 기준크기)));
    },
    화면크기변경() {
      this.모바일보기 = window.innerWidth <= 850;
      if (!this.모바일보기) { this.목록닫기(); }
      const 칸수 = this.한줄칸수();
      if (칸수 === this.현재한줄칸수) { return; }
      this.현재한줄칸수 = 칸수;
      this.그림판?.보기설정(필사팔레트들[this.설정.테마], 칸수,
        this.설정.커서깜빡임);
    },

    reset(새로시작 = false) {
      this.입력기록저장();
      this.밀린기록저장();
      this.그림판?.종료();
      this.결과화면보이기 = false;
      this.진행률 = 0;
      this.입력상태 = '대기';
      this.시작시각 = null;
      this.완료초 = 0;
      this.총입력타수 = 0;
      this.정타수 = 0;
      this.분당타수 = 0;
      this.종전최고정타율 = null;
      this.시도ID = null;
      this.이어쓰기원본 = null;
      this.다음기록순서 = 0;
      this.이어쓰기복원됨 = false;
      const 지문 = new 지문틀();
      지문.글쓰기(this.오늘지문.본문);
      지문.쓰기(지문.위치, 끝글자);
      const 팔레트 = 필사팔레트들[this.설정.테마];
      const 본문 = markRaw(new 따라그리기틀(지문, 팔레트));
      this.본문 = 본문;
      const 복원 = 새로시작 ? undefined : (this.복원할시도() ?? this.완료한시도());
      if (복원) {
        if (!복원.완료) {
          this.이어쓰기원본 = { attemptId: 복원.시작.attemptId,
            inputCount: 복원.입력들.length, elapsedMs: 복원.걸린밀리초 };
          this.이어쓰기복원됨 = true;
        }
        for (const 키 of 복원.입력들) { 본문.입력(키.code, 키.shift); }
        this.진행률 = 본문.진행률;
        this.입력상태 = 본문.방금오타 ? '오타' : '진행';
        if (본문.끝) {
          const 걸린밀리초 = Math.max(1000, 복원.완료?.elapsedMs ?? 복원.걸린밀리초);
          this.완료초 = Math.max(1, Math.round(걸린밀리초 / 1000));
          this.총입력타수 = 본문.입력타수;
          this.정타수 = 본문.유효타수;
          this.분당타수 = Math.round(this.정타수 * 60000 / 걸린밀리초);
          this.종전최고정타율 = 지문최고정타율(this.시도들, this.오늘지문.id,
            본문버전(this.오늘지문.본문), 복원.완료 ? 복원.시작.attemptId : undefined);
          this.결과화면보이기 = true;
          if (!복원.완료) {
            this.저장대기(시도완료(복원.시작.attemptId, 걸린밀리초, this.총입력타수, this.정타수));
          }
        }
      }
      const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
      const ctx = 캔버스.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
      this.현재한줄칸수 = this.한줄칸수();
      const 그림판 = markRaw(new 그림판틀(ctx, 본문, {
        팔레트, 한줄칸수: this.현재한줄칸수,
        최소높이: 210,
        커서깜빡임: this.설정.커서깜빡임,
        안티앨리어싱: 단계별안티앨리어싱강도[this.설정.안티앨리어싱단계],
        영문글꼴: false,
      }));
      this.그림판 = 그림판;
      그림판.그리기();
      this.$nextTick(() => {
        const 종이 = document.querySelector('.종이');
        if (종이) { 종이.scrollTop = 0; }
      });
      const self = this;
      window.onkeydown = (e: KeyboardEvent) => {
        if (e.code === 'Escape' && self.목록열림) {
          self.목록닫기();
          return;
        }
        if (e.code === 'Tab' && self.목록열림) {
          const 버튼들 = Array.from(document.querySelectorAll<HTMLElement>('.선택패널 button'));
          const 첫버튼 = 버튼들[0];
          const 끝버튼 = 버튼들[버튼들.length - 1];
          if (e.shiftKey && document.activeElement === 첫버튼) {
            e.preventDefault();
            끝버튼?.focus();
          } else if (!e.shiftKey && document.activeElement === 끝버튼) {
            e.preventDefault();
            첫버튼?.focus();
          }
          return;
        }
        if (e.code === 'Escape' && self.설정열림) {
          self.설정열림 = false;
          return;
        }
        if ((e.target as HTMLElement | null)?.closest('button, input, select, textarea, summary, a, [contenteditable="true"]')) {
          return;
        }
        if (self.결과화면보이기) {
          if (e.key === 'Enter' && !e.repeat && !e.isComposing && !e.defaultPrevented &&
              !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
              !self.목록열림 && !self.설정열림 && self.다음편) {
            e.preventDefault();
            self.지문선택(self.다음편);
          }
          return;
        }
        if (e.code.startsWith('Shift') || e.code.startsWith('Control') ||
            e.code.startsWith('Alt') || e.code.startsWith('Meta') ||
            e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta') ||
            !/^(Key[A-Z]|Digit[0-9]|Space|Enter|Backspace|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(e.code) ||
            self.목록열림) {
          return;
        }
        e.preventDefault();
        if (self.시작시각 === null) {
          self.시작시각 = performance.now() - (self.이어쓰기원본?.elapsedMs ?? 0);
        }
        if (self.시도ID === null) {
          const 시작 = 시도시작(self.오늘지문.id,
            self.오늘날짜, 본문버전(self.오늘지문.본문),
            self.이어쓰기원본 ?? undefined);
          self.시도ID = 시작.attemptId;
          self.이어쓰기원본 = null;
          self.저장대기(시작);
        }
        const 직전오타 = self.입력상태 === '오타';
        const 바뀐위치 = 본문.입력(e.code, e.shiftKey);
        self.입력기록추가({ code: e.code, shift: e.shiftKey });
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
          self.종전최고정타율 = 지문최고정타율(self.시도들, self.오늘지문.id,
            본문버전(self.오늘지문.본문));
          self.입력기록저장();
          self.저장대기(시도완료(self.시도ID, 걸린밀리초, self.총입력타수, self.정타수));
          self.결과화면보이기 = true;
        } else {
          const 커서세로 = 그림판.커서세로위치;
          if (커서세로 !== null) {
            const 종이 = 캔버스.closest('.종이');
            if (종이) {
              const 화면세로 = 캔버스.getBoundingClientRect().top + 커서세로 * 캔버스.clientHeight / 캔버스.height;
              const 경계 = 종이.getBoundingClientRect().bottom - 36;
              if (화면세로 > 경계) { 종이.scrollTop += 화면세로 - 경계; }
            }
          }
        }
      };
    },
  },
  mounted() {
    document.title = '글숨 · 한글 필사';
    this.설정 = 필사설정읽기();
    this.기록들 = 진행작업읽기();
    const 선택 = 지문선택읽기();
    this.오늘날짜 = 날짜키(new Date());
    this.글테마 = 선택.테마;
    this.오늘지문 = 선택.지문;
    document.addEventListener('pointerdown', this.설정밖클릭);
    document.addEventListener('visibilitychange', this.날짜변경확인);
    window.addEventListener('pagehide', this.입력기록저장);
    window.addEventListener('storage', this.다른탭기록반영);
    window.addEventListener('resize', this.화면크기변경);
    this.날짜확인타이머 = setInterval(this.날짜변경확인, 60000);
    this.reset();
  },
  beforeUnmount() {
    document.title = '글숨 · 글꼴 편집기';
    document.removeEventListener('pointerdown', this.설정밖클릭);
    document.removeEventListener('visibilitychange', this.날짜변경확인);
    window.removeEventListener('pagehide', this.입력기록저장);
    window.removeEventListener('storage', this.다른탭기록반영);
    window.removeEventListener('resize', this.화면크기변경);
    if (this.날짜확인타이머 !== null) { clearInterval(this.날짜확인타이머); }
    this.입력기록저장();
    window.onkeydown = null;
    this.그림판?.종료();
  },
  computed: {
    시도들(): 필사시도[] {
      return 시도목록(this.기록들);
    },
    현재지문들(): readonly 연습지문[] {
      return 테마별지문들[this.글테마];
    },
    다음편(): 연습지문 | null {
      if (!this.오늘지문.원문URL) { return null; }
      const 순서 = this.현재지문들.findIndex((지문) => 지문.id === this.오늘지문.id);
      return 순서 < 0 ? null : this.현재지문들[순서 + 1] ?? null;
    },
    걸린시간() {
      return `${Math.floor(this.완료초 / 60)}분 ${this.완료초 % 60}초`;
    },
    정타율(): string {
      return 정타율(this.정타수, this.총입력타수);
    },
    종전최고표시(): string {
      return this.종전최고정타율 === null ? '' : 정타율표시(this.종전최고정타율);
    },
    정타율차이(): number {
      return this.종전최고정타율 === null ? 0
        : Math.round((Number(this.정타율) - this.종전최고정타율) * 100) / 100;
    },
    정타율차이표시(): string {
      const 차이 = this.정타율차이;
      return `${차이 > 0 ? '+' : 차이 < 0 ? '-' : ''}${정타율표시(Math.abs(차이))}`;
    },
    상태문구() {
      if (this.결과화면보이기) { return '이 글의 필사를 마쳤어요'; }
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
  --출처링크: #6e675c;
  --출처링크호버: #38372f;
  --강조: #82755f;
  --강조호버: #665b49;
  --역글: #fff;
  --테두리: #ddd7ca;
  --연테두리: #e8e3d9;
  --종이: #fff;
  --선택바탕: #eae4d7;
  --선택안함: rgba(255, 255, 255, .44);
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
  --출처링크: #526e7b;
  --출처링크호버: #30444f;
  --강조: #607f8d;
  --강조호버: #456674;
  --역글: #fff;
  --테두리: #cddde1;
  --연테두리: #dce7e9;
  --종이: #fafcfc;
  --선택바탕: #dbe8ec;
  --선택안함: rgba(255, 255, 255, .52);
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
  --출처링크: #b2bdb9;
  --출처링크호버: #e0e5df;
  --강조: #b6c8be;
  --강조호버: #d1e0d3;
  --역글: #1e292e;
  --테두리: #3b4b4f;
  --연테두리: #435155;
  --종이: #222c31;
  --선택바탕: #334348;
  --선택안함: #263238;
  --진행바탕: #28353a;
  --진행테두리: #405056;
  --진행선: #4b5d5f;
  --진행활성: #b8b089;
  --오류색: #d7977f;
  --완료색: #9dbb9d;
}

.필사실[data-theme='매트릭스'] {
  --화면: #061009;
  --장식빛: rgba(43, 202, 82, .08);
  --글: #b2f7b9;
  --보조글: #8acb92;
  --옅은글: #75aa7d;
  --출처링크: #8acb92;
  --출처링크호버: #b2f7b9;
  --강조: #63f583;
  --강조호버: #a0ffb4;
  --역글: #061009;
  --테두리: #315c3b;
  --연테두리: #2b5735;
  --종이: #08190e;
  --선택바탕: #173923;
  --선택안함: #0d2415;
  --진행바탕: #0c2515;
  --진행테두리: #376947;
  --진행선: #34603d;
  --진행활성: #63f583;
  --오류색: #ffc18a;
  --완료색: #8affac;
}

.필사실[data-theme='PC통신'] {
  --화면: #081666;
  --장식빛: rgba(168, 190, 255, .07);
  --글: #fff;
  --보조글: #dbe5ff;
  --옅은글: #bbcdfa;
  --출처링크: #dbe5ff;
  --출처링크호버: #fff;
  --강조: #fff;
  --강조호버: #dbe5ff;
  --역글: #102287;
  --테두리: #7894e8;
  --연테두리: #7793e9;
  --종이: #102287;
  --선택바탕: #2843a8;
  --선택안함: #11267f;
  --진행바탕: #132b91;
  --진행테두리: #7894e8;
  --진행선: #6885dc;
  --진행활성: #fff;
  --오류색: #ffd0ae;
  --완료색: #e2fff0;
}

.필사실[data-theme='호박색 모니터'] {
  --화면: #120e08;
  --장식빛: rgba(255, 166, 55, .08);
  --글: #f8d79a;
  --보조글: #cfaa70;
  --옅은글: #ab8656;
  --출처링크: #cfaa70;
  --출처링크호버: #f8d79a;
  --강조: #ffbc55;
  --강조호버: #ffd98b;
  --역글: #231306;
  --테두리: #77512a;
  --연테두리: #704a27;
  --종이: #1b1209;
  --선택바탕: #3b2712;
  --선택안함: #24180c;
  --진행바탕: #271a0d;
  --진행테두리: #79552f;
  --진행선: #654522;
  --진행활성: #ffc15e;
  --오류색: #ff9476;
  --완료색: #f9d383;
}

.필사실:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .지문머리 h2 {
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 700;
  letter-spacing: -.02em;
}
.필사실:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .브랜드문양,
.필사실:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .종이,
.필사실:is([data-theme='매트릭스'], [data-theme='PC통신'], [data-theme='호박색 모니터']) .진행판 {
  border-radius: 0;
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
.브랜드 { display: flex; align-items: center; gap: 11px; text-decoration: none; }
.브랜드:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
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
.테마견본[data-theme='매트릭스'] { background: #08190e; color: #9affaa; text-shadow: 0 0 7px rgba(99, 245, 131, .65); }
.테마견본[data-theme='PC통신'] { background: #102287; color: #fff; }
.테마견본[data-theme='호박색 모니터'] { background: #1b1209; color: #ffdc94; text-shadow: 0 0 7px rgba(255, 191, 87, .65); }
.설정선택 { display: flex; gap: 7px; }
.설정선택 button { min-width: 72px; padding: 8px 13px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 12px; cursor: pointer; }
.가장자리선택 input { display: block; width: 100%; margin: 0; accent-color: var(--강조); cursor: pointer; }
.가장자리눈금 { display: flex; justify-content: space-between; margin: 2px 7px 0; }
.가장자리눈금 span { width: 2px; height: 4px; background: var(--테두리); }
.가장자리끝표시 { display: flex; justify-content: space-between; margin-top: 4px; color: var(--옅은글); font-size: 11px; }
.설정안내 { margin: 3px 0 0; color: var(--옅은글); font-size: 11px; }

.분류, .마침꼬리 {
  color: var(--강조);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}
.작업공간 { padding-bottom: 84px; }
.선택머리 { display: flex; justify-content: space-between; align-items: end; gap: 20px; }
.구역번호 { color: var(--강조); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.구역번호 span { padding: 0 5px; color: var(--옅은글); }
.선택머리 h2 { margin: 9px 0 0; font-size: 18px; font-weight: 650; letter-spacing: -.045em; }
.글테마선택 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; width: min(100%, 542px); margin-top: 18px; }
.글테마선택 button {
  min-width: 0;
  padding: 10px 17px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
  color: var(--보조글);
  font-size: 13px;
  cursor: pointer;
}
.글테마선택 button.선택됨 { border-color: var(--강조); background: var(--선택바탕); color: var(--글); font-weight: 700; }
.지문서랍 { margin-top: 21px; }
.지문서랍 h3 { margin: 0; color: var(--강조); font-size: 12px; font-weight: 600; }
.지문서랍 h3 span { margin-left: 8px; color: var(--옅은글); font-weight: 400; }
.글목록 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-top: 13px; }
.글목록 button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-height: 57px;
  padding: 11px 13px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
  color: var(--글);
  text-align: left;
  cursor: pointer;
}
.글목록 button:hover, .글목록 button.선택됨 { border-color: var(--강조); background: var(--선택바탕); }
.글목록 strong { font-size: 12px; }
.글목록 span { color: var(--보조글); font-size: 10px; }
.글목록 em { font-style: normal; }
.글목록 em.완료 { color: var(--완료색); font-weight: 700; }
.글목록 .최고정타율 { color: var(--보조글); font-size: inherit; font-variant-numeric: tabular-nums; }
.종이 {
  margin-top: 22px;
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
.지문머리 h2 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(28px, 3vw, 37px);
  font-weight: 500;
  letter-spacing: -.04em;
}
.출처 { margin: 14px 0 0; color: var(--옅은글); font-size: 12px; }
.출처 a,
.출처 a:visited {
  color: var(--출처링크);
  text-decoration: underline;
  text-decoration-color: var(--옅은글);
  text-underline-offset: 3px;
}
.출처 a:hover,
.출처 a:focus-visible { color: var(--출처링크호버); text-decoration-color: currentColor; }
.출처 a:focus-visible { outline: 2px solid var(--강조); outline-offset: 3px; }
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
.기록안내 { margin: 10px 0 0; color: var(--보조글); font-size: 11px; }
.기록안내[role="alert"] { color: var(--오류색); }
.진행아래 { display: flex; justify-content: space-between; align-items: center; gap: 20px; max-width: 800px; margin: 19px auto 0; color: var(--보조글); font-size: 11px; }
.글자버튼 { padding: 4px 0; border: 0; background: none; color: var(--강조); font-size: 12px; cursor: pointer; }
.글자버튼:hover { color: var(--글); text-decoration: underline; text-underline-offset: 4px; }
.글자버튼 span { margin-left: 4px; font-size: 16px; }
.마침 {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 800px;
  margin: 23px auto 0;
  padding: 23px 0 0;
  border-top: 1px solid var(--진행선);
}
.마침꼬리 { margin: 0 0 10px; }
.마침내용 { min-width: 0; }
.마침통계 { display: flex; flex-wrap: wrap; gap: 12px 26px; margin: 24px 0 0; padding: 15px 0 0; border-top: 1px solid var(--진행선); }
.마침통계 div { display: flex; flex-direction: column; gap: 5px; }
.마침통계 dt { color: var(--옅은글); font-size: 11px; }
.마침통계 dd { margin: 0; color: var(--보조글); font-size: 12px; font-variant-numeric: tabular-nums; }
.정타율비교 { margin: 10px 0 0; color: var(--보조글); font-size: 11px; font-variant-numeric: tabular-nums; }
.정타율비교 strong { color: var(--글); }
.마침동작 { display: flex; flex-direction: column; align-items: center; gap: 9px; margin-left: auto; }
.주버튼 { min-width: 132px; padding: 11px 14px; border: 1px solid var(--강조); border-radius: 2px; background: var(--강조); color: var(--역글); font-size: 12px; cursor: pointer; }
.주버튼:hover { background: var(--강조호버); }
.주버튼 span { margin-left: 12px; }
button:focus-visible { outline: 2px solid var(--강조); outline-offset: 3px; }
/* 글 선택, 입력, 결과가 같은 높이 안에서 이어지는 작업대 */
.페이지 { display: flex; flex-direction: column; height: 100dvh; }
.상단 { flex: none; height: 62px; }
.작업공간 {
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  gap: 18px;
  flex: 1;
  min-height: 0;
  padding: 16px 0 20px;
}
.모바일선택줄, .목록가림막, .목록닫기 { display: none; }
.선택패널 {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px 14px 14px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
}
.선택머리 { align-items: start; }
.선택머리 h2 { margin-top: 6px; font-size: 17px; }
.글테마선택 { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; gap: 6px; margin-top: 18px; }
.글테마선택 button { padding: 8px 5px; font-size: 12px; }
.지문서랍 { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-top: 20px; }
.글목록 { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 6px; overflow-y: auto; overscroll-behavior: contain; padding-right: 3px; }
.글목록 button { min-height: 51px; flex: none; padding: 9px 11px; }
.필사패널 { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.필사실[data-theme='매트릭스'] .종이 { box-shadow: inset 0 0 38px rgba(43, 202, 82, .06); }
.필사실[data-theme='PC통신'] .종이 { box-shadow: none; }
.필사실[data-theme='호박색 모니터'] .종이 { box-shadow: inset 0 0 38px rgba(255, 166, 55, .06); }
.종이 {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 18px clamp(18px, 3vw, 38px) 28px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.지문머리 { padding-top: 12px; }
.분류 { margin-bottom: 8px; }
.지문머리 h2 { font-size: clamp(24px, 2.5vw, 30px); }
.출처 { margin-top: 7px; }
.가는선 { margin-top: 18px; }
.캔버스영역 { margin-top: 16px; }
.진행판 { flex: none; max-width: none; margin: 8px 0 0; padding: 12px 19px; }
.진행아래 { margin-top: 9px; }
.마침 { max-width: none; gap: 18px; margin-top: 10px; padding-top: 11px; }
.마침내용 { flex: 1; }
.마침꼬리 { margin: 0; }
.마침통계 { gap: 8px 22px; margin-top: 10px; padding-top: 10px; }
.마침동작 { flex: none; }

@media (max-width: 850px) {
  .페이지 { padding: 0 14px; }
  .상단 { height: 56px; }
  .상단문구 { display: none; }
  .작업공간 { display: flex; flex-direction: column; gap: 9px; padding: 9px 0 11px; }
  .모바일선택줄 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex: none;
    min-height: 44px;
  }
  .모바일선택줄 div { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
  .모바일선택줄 div span { color: var(--옅은글); font-size: 10px; }
  .모바일선택줄 strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
  .모바일선택줄 button { flex: none; padding: 8px 10px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 12px; cursor: pointer; }
  .모바일선택줄 button span { margin-left: 7px; }
  .목록가림막 { display: block; position: fixed; z-index: 19; inset: 0; background: rgba(0, 0, 0, .4); }
  .선택패널 {
    position: fixed;
    z-index: 20;
    right: 0;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    height: min(90dvh, 800px);
    padding: 20px 20px max(20px, env(safe-area-inset-bottom));
    border-radius: 12px 12px 0 0;
    background: var(--종이);
    box-shadow: 0 -14px 40px rgba(0, 0, 0, .18);
  }
  .목록닫기 { display: block; border: 0; background: none; color: var(--보조글); font-size: 26px; line-height: 1; cursor: pointer; }
  .글테마선택 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .글테마선택 button:last-child:nth-child(odd) { grid-column: auto; }
  .글목록 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; }
  .글목록 button { min-height: 56px; }
  .필사패널 { flex: 1; }
  .종이 { padding: 13px 16px 22px; }
  .지문머리 { padding-top: 8px; }
  .지문머리 h2 { font-size: 25px; }
  .가는선 { margin-top: 15px; }
  .캔버스영역 { margin-top: 14px; }
  .진행판 { margin-top: 7px; padding: 10px 14px; }
  .진행아래 { flex-direction: row; align-items: center; gap: 8px; margin-top: 8px; }
  .마침 { align-items: start; flex-wrap: wrap; gap: 8px; }
  .마침내용 { flex-basis: 100%; }
  .마침통계 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
  .마침통계 dd { font-size: 11px; }
  .마침동작 { width: auto; margin: 0; }
  .주버튼 { padding: 8px 11px; }
}

@media (max-width: 380px) {
  .진행아래 > span { display: none; }
  .마침통계 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .진행막대 span { transition: none; }
}
</style>
