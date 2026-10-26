<template>
  <main class="필사실" :data-theme="설정.테마">
    <div class="페이지">
      <header class="상단">
        <a class="브랜드" href="#" aria-label="글숨 첫 화면으로 이동">
          <GeulsumMark :key="`문양-${설정.테마}`" class="브랜드문양" />
          <span class="브랜드글자"><GeulsumTitle :key="`타이틀-${설정.테마}`" class="브랜드타이틀" :src="연필타이틀" :width="1736" :height="906" :gap-reduction="55" /><small class="공식주소">dailytyping.com</small></span>
        </a>
        <div class="상단동작">
          <a class="최근버튼" href="#recent">최근 기록</a>
          <a class="도움말버튼" href="#help" aria-keyshortcuts="Alt+H">도움말</a>
          <button type="button" class="설정버튼" aria-controls="필사설정"
            :aria-expanded="설정열림" aria-keyshortcuts="Alt+S"
            @click="설정토글">환경설정 <span aria-hidden="true">⚙</span></button>
        </div>
        <section v-show="설정열림" id="필사설정" class="설정패널" aria-label="필사 환경설정">
          <div class="설정머리">
            <strong>환경설정</strong>
            <button type="button" class="설정닫기" aria-label="환경설정 닫기" @click="환경설정닫기">×</button>
          </div>
          <fieldset>
            <legend>색상 테마</legend>
            <div class="테마선택" @keydown="선택버튼화살표">
              <button v-for="테마 in 테마선택지" :key="테마.이름" type="button" class="테마버튼"
                :class="{ 선택됨: 설정.테마 === 테마.이름 }" :aria-pressed="설정.테마 === 테마.이름"
                @click="설정변경({ 테마: 테마.이름 })">
                <span class="테마견본" :data-theme="테마.이름" aria-hidden="true">가</span>
                <span>{{테마.이름}}</span>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="준비중테마선택지.length">
            <legend>준비 중 테마</legend>
            <div class="테마선택" @keydown="선택버튼화살표">
              <button v-for="테마 in 준비중테마선택지" :key="테마.이름" type="button" class="테마버튼"
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
          <div><span>선택한 글</span><strong>{{주제표시이름(원래글테마)}} · {{오늘지문.제목}}</strong></div>
          <button type="button" aria-controls="지문선택창" :aria-expanded="목록열림"
            aria-keyshortcuts="Alt+G"
            @click="목록열기">주제 고르기 <span aria-hidden="true">⌄</span></button>
        </div>
        <div v-if="모바일보기 && 목록열림" class="목록가림막" @click="목록닫기"></div>
        <aside v-show="!모바일보기 || 목록열림" id="지문선택창" class="선택패널"
          :role="모바일보기 ? 'dialog' : undefined" :aria-modal="모바일보기 ? 'true' : undefined"
          aria-label="필사 주제와 지문 고르기">
          <div class="선택머리">
            <div>
              <span class="구역번호">필사할 주제</span>
              <div class="선택제목줄">
                <h2>주제 고르기</h2>
              </div>
            </div>
            <button type="button" class="목록닫기" aria-label="주제 선택창 닫기" @click="목록닫기">×</button>
          </div>
          <div class="주제목록">
            <section v-for="묶음 in 주제선택묶음들" :key="묶음.이름" class="주제묶음"
              :aria-label="묶음.이름 || '공개 주제'">
              <h3 v-if="묶음.이름">{{묶음.이름}}</h3>
              <div class="글테마선택" role="group" :aria-label="묶음.이름 || '공개 주제'" @keydown="선택버튼화살표">
                <button v-for="테마 in 묶음.주제들" :key="테마" type="button"
                  :class="{ 선택됨: 글테마 === 테마 }" :aria-pressed="글테마 === 테마"
                  :aria-label="`${주제표시이름(테마)}, ${주제완료도[테마].전체}편 중 ${주제완료도[테마].완료}편 완료`"
                  @click="글테마바꾸기(테마, $event)">
                  <span class="주제이름">{{주제표시이름(테마)}}</span>
                  <span class="주제진행바탕" aria-hidden="true">
                    <span :style="{ width: `${주제완료도[테마].비율}%` }"></span>
                  </span>
                </button>
              </div>
            </section>
          </div>
          <section class="지문서랍" :aria-label="`${주제표시이름(글테마)} 지문 목록`">
            <h3>{{글테마 === '즐겨찾기' ? '모아 둔 글' : `${주제표시이름(글테마)} · 전체 글`}} <span>{{현재지문들.length}}편</span></h3>
            <div class="글목록" role="group" :aria-label="`${주제표시이름(글테마)} 지문 선택`" @keydown="선택버튼화살표">
              <button v-for="지문 in 현재지문들" :key="지문.id" type="button" class="지문선택버튼"
                :class="{ 선택됨: 오늘지문.id === 지문.id, 도장있음: !!지문도장(지문) }" :aria-pressed="오늘지문.id === 지문.id"
                @click="지문선택(지문, $event)">
                <span class="지문목록머리"><strong>{{지문.제목}}</strong></span>
                <span class="지문설명">{{지문.주제}} · <em :class="{ 완료: 지문상태(지문) === '완료' }">{{지문상태(지문)}}</em><small v-if="지문최고(지문) !== null" class="최고정타율"> · 최고 {{지문최고(지문)}}%</small></span>
                <PraiseStamp v-if="지문도장(지문)" :grade="지문도장(지문)!" compact class="지문목록도장" />
              </button>
              <p v-if="글테마 === '즐겨찾기' && 현재지문들.length === 0" class="빈즐겨찾기">마음에 드는 글의 별을 누르면 이곳에 모입니다.</p>
            </div>
          </section>
        </aside>

        <div class="필사패널">
        <div class="종이외피" :class="{ 동적배경작동: 동적배경사용가능 }">
        <canvas id="효과캔버스" v-show="동적배경사용가능" aria-hidden="true"></canvas>
        <article class="종이" aria-labelledby="지문제목">
          <div class="종이상단">
            <button type="button" class="본문즐겨찾기" :class="{ 선택됨: 즐겨찾기인가(오늘지문.id) }"
              :aria-label="`${오늘지문.제목} 즐겨찾기 ${즐겨찾기인가(오늘지문.id) ? '해제' : '추가'}`"
              :aria-pressed="즐겨찾기인가(오늘지문.id)" aria-keyshortcuts="Alt+F"
              @click="즐겨찾기토글(오늘지문.id)">
              <span aria-hidden="true">{{즐겨찾기인가(오늘지문.id) ? '★' : '☆'}}</span>
            </button>
          </div>
          <div class="지문삽화자리" :class="{ 어두운삽화: 어두운삽화테마 }" aria-hidden="true">
            <svg v-if="현재삽화" viewBox="0 0 235 118" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="지문삽화밝은테마" color-interpolation-filters="sRGB">
                  <!-- 밝은 바탕은 지우고 연필 선의 진하기만 투명도로 남긴다. -->
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 1 0" result="연필선" />
                  <feComponentTransfer in="연필선" result="선명한연필선">
                    <feFuncA type="linear" slope="1.5" />
                  </feComponentTransfer>
                  <feFlood flood-color="currentColor" result="테마색" />
                  <feComposite in="테마색" in2="선명한연필선" operator="in" />
                </filter>
                <filter id="지문삽화어두운테마" color-interpolation-filters="sRGB">
                  <!-- 밝은 면을 살리고, 어두운 연필선도 희미하게 남겨 윤곽을 유지한다. -->
                  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.17008 0.57216 0.05776 0.2 0" result="밝은면" />
                  <feComposite in="밝은면" in2="SourceAlpha" operator="in" result="인체형태" />
                  <feComponentTransfer in="인체형태" result="밝은층">
                    <feFuncA type="linear" slope="0.9" />
                  </feComponentTransfer>
                  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 1 0" result="윤곽선" />
                  <feComponentTransfer in="윤곽선" result="옅은윤곽선">
                    <feFuncA type="linear" slope="0.25" />
                  </feComponentTransfer>
                  <feComposite in="옅은윤곽선" in2="밝은층" operator="over" result="두톤" />
                  <feFlood flood-color="currentColor" result="테마색" />
                  <feComposite in="테마색" in2="두톤" operator="in" />
                </filter>
              </defs>
              <image :href="현재삽화" width="235" height="118"
                :filter="어두운삽화테마 ? 'url(#지문삽화어두운테마)' : 'url(#지문삽화밝은테마)'" />
            </svg>
          </div>
          <div class="지문머리" :class="{ 도장찍힘: !!이번도장 }">
            <div class="지문머리내용">
              <p class="분류">{{오늘지문.주제}}</p>
              <h2 id="지문제목">{{오늘지문.제목}}</h2>
              <p class="출처" v-if="오늘지문.원문URL">
                <a :href="오늘지문.원문URL" target="_blank" rel="noopener noreferrer">{{오늘지문.저자}} · 위키문헌 원문 ↗</a>
              </p>
              <p v-if="즐겨찾기오류" class="즐겨찾기안내" role="alert">즐겨찾기를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</p>
            </div>
            <div v-if="이번도장" class="도장묶음">
              <PraiseStamp v-if="이번최고기록" grade="PB" large class="개인최고도장" />
              <PraiseStamp :grade="이번도장" large class="완료도장" />
            </div>
          </div>
          <div class="가는선" aria-hidden="true"></div>

          <div class="캔버스영역">
            <canvas id="캔버스" width="1286" height="210"
              :aria-label="`${오늘지문.제목} 필사 지문. 키보드로 따라 입력하세요.`"></canvas>
          </div>
        </article>
        </div>

        <section class="진행판" aria-label="필사 진행 상황">
          <div class="진행영역">
            <div class="진행문구">
              <span class="상태표시" :class="{ 오류: 입력상태 === '오타', 완료: 결과화면보이기 }" aria-hidden="true"></span>
              <span role="status" aria-live="polite">{{상태문구}}</span>
              <span v-if="결과화면보이기" class="그래프설명">정타율 × 속도</span>
              <span v-if="!결과화면보이기" class="진행숫자" role="progressbar" :aria-valuenow="진행률" aria-valuemin="0"
                aria-valuemax="100" :aria-label="`${오늘지문.제목} 필사 진행률`">{{진행률}}%</span>
            </div>
            <div v-if="결과화면보이기" class="리듬그래프" role="img" aria-label="글 전체 진행 위치에 따른 정타와 상대적인 입력 속도. 오타는 다른 색으로 표시됩니다.">
              <span v-for="(막대, 순서) in 완료리듬막대들" :key="순서" class="리듬칸" aria-hidden="true">
                <span v-if="막대" class="리듬막대" :class="{ 오타: 막대.오타 }"
                  :style="{ height: `${막대.높이}%` }"></span>
              </span>
            </div>
            <div v-else class="진행막대" aria-hidden="true">
              <span :style="{ width: `${진행률}%` }"></span>
            </div>
            <p v-if="기록오류" class="기록안내" role="alert">진행 기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</p>
            <p v-else-if="이어쓰기복원됨" class="기록안내">이 브라우저에 저장된 지점부터 이어 씁니다.</p>
          </div>

          <div v-if="결과화면보이기" class="마침">
            <div class="마침내용">
              <div class="마침머리"><p class="마침꼬리">한 편을 마쳤어요</p></div>
              <dl class="마침통계" aria-label="이번 필사 기록">
                <div><dt>이번 정타율</dt><dd>{{정타율}}% ({{정타수}}/{{총입력타수}})</dd></div>
                <div><dt>걸린 시간</dt><dd>{{걸린시간}}</dd></div>
              </dl>
              <div v-if="이번최고기록 || 종전최고정타율 !== null" class="기록비교묶음">
                <p v-if="이번최고기록" class="개인최고안내">
                  이번 정타율이 최고 기록이에요.
                </p>
                <p v-if="종전최고정타율 !== null" class="정타율비교">
                  최고 {{종전최고표시}}% 대비 <strong>{{정타율차이표시}}%p</strong>
                </p>
              </div>
            </div>
            <div class="마침동작">
              <button type="button" class="주버튼" aria-keyshortcuts="Enter" @click="다음글시작">다음 지문 시작 <span aria-hidden="true">→</span></button>
              <button type="button" class="글자버튼" aria-keyshortcuts="Alt+R" @click="다시쓰기">이 글 다시 쓰기 <span aria-hidden="true">↺</span></button>
            </div>
          </div>

          <div v-else class="진행아래">
            <span>띄어쓰기와 줄바꿈은 건너뛰어도 괜찮아요.</span>
            <button type="button" class="글자버튼" aria-keyshortcuts="Alt+R" @click="다시쓰기">처음부터 다시 쓰기 <span aria-hidden="true">↺</span></button>
          </div>
          <div class="타자기통풍구" aria-hidden="true"></div>
        </section>

        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import GeulsumMark from '@/components/GeulsumMark.vue';
import GeulsumTitle from '@/components/GeulsumTitle.vue';
import 연필타이틀 from '@/assets/geulsum-title-pencil-spaced.png';
import PraiseStamp from '@/components/PraiseStamp.vue';
import swimmingFreestyle from '@/assets/swimming-freestyle.webp';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 동적종이효과 } from '@/animated-paper';
import { 움직이는테마인가 } from '@/animated-shaders';
import { 빈리듬그래프, 완료리듬그래프, type 리듬막대 } from '@/practice-rhythm';
import { 지문찾기 } from '@/practice-recent';
import { 즐겨찾기바꾸기, 즐겨찾기읽기, 즐겨찾기저장, 즐겨찾기저장키,
  즐겨찾기지문들 as 모은지문들, 지문원래테마 } from '@/practice-favorites';
import { 필사단축키, type 필사단축동작 } from '@/practice-shortcuts';
import { 날짜키, 테마별지문들,
  type 연습지문, type 지문테마 } from '@/practice-passages';
import { 표시주제들, 주제선택묶음들, 공개주제인가, 주제표시이름,
  type 선택주제 } from '@/practice-pinned-topics';
import { 정식사이트인가 } from '@/practice-release';
import { 다음미완료지문, 첫진입지문선택, 주제지문선택, 주제완료현황,
  지문모음선택, 지문모음완료현황, 마지막지문읽기, 마지막지문저장 } from '@/practice-selection';
import { 본문버전, 브라우저저장소, 시도목록, 시도시작, 시도완료, 시도중단, 입력묶음,
  지문입력상태, 지문재개시도, 지문최고정타율, 지문도장등급, 정타도장,
  정타율, 정타율표시, 이번이최고정타율인가, type 칭찬도장종류,
  진행기록키인가, 진행작업읽기, 진행작업저장, 작업합치기, type 입력키, type 진행작업,
  type 필사시도, type 이어쓰기원본 } from '@/practice-progress';
import { 기본필사설정, 필사설정, 필사설정읽기, 필사설정저장,
  공개필사테마들, 준비중필사테마들, 지문크기, 안티앨리어싱단계, 단계별안티앨리어싱강도,
  글자크기별글꼴, 필사팔레트들 } from '@/practice-settings';

const 정식사이트 = 정식사이트인가();
const 테마선택지 = 공개필사테마들.map(이름 => ({ 이름 }));
const 준비중테마선택지 = 정식사이트 ? [] : 준비중필사테마들.map(이름 => ({ 이름 }));
const 글자크기선택지: 지문크기[] = ['작게', '보통', '크게'];
const 가장자리단계이름 = ['선명하게', '조금 선명하게', '보통', '조금 부드럽게', '부드럽게'];
const 지문삽화들: Record<string, string> = {
  UlRmQaTpLnVe: swimmingFreestyle,
};
const 어두운삽화테마들 = new Set(['밤', '숲', '청보리', '폭포', '커피', '촛불', '매트릭스', 'PC통신', '서가',
  '수면과 파문', '빗방울', '구름', '모닥불', '인센스', '오로라', '별똥별']);
export default defineComponent({
  components: { GeulsumMark, GeulsumTitle, PraiseStamp },
  props: {
    requestedPassageId: { type: String, default: undefined },
  },
  data() {
    return {
      연필타이틀,
      오늘날짜: 날짜키(new Date()),
      오늘지문: 테마별지문들.시작하기[0],
      글테마: '시작하기' as 선택주제,
      글테마선택지: 표시주제들(),
      주제선택묶음들: 주제선택묶음들(),
      테마선택지,
      준비중테마선택지,
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
      종전최고정타율: null as number | null,
      기록들: [] as 진행작업[],
      즐겨찾기IDs: [] as string[],
      즐겨찾기오류: false,
      시도ID: null as string | null,
      이어쓰기원본: null as 이어쓰기원본 | null,
      다음기록순서: 0,
      미기록입력: [] as 입력키[],
      미저장작업: [] as 진행작업[],
      기록타이머: null as ReturnType<typeof setTimeout> | null,
      기록오류: false,
      이어쓰기복원됨: false,
      그림판: null as 그림판틀 | null,
      동적배경: null as 동적종이효과 | null,
      동적배경사용가능: false,
      폭관찰기: null as ResizeObserver | null,
      본문: null as 따라그리기틀 | null,
    };
  },
  methods: {
    목록열기() {
      this.설정열림 = false;
      this.목록열림 = true;
      this.$nextTick(() => (document.querySelector<HTMLElement>('.글테마선택 button.선택됨')
        ?? document.querySelector<HTMLElement>('.글테마선택 button'))?.focus());
    },
    목록닫기() {
      const 열려있음 = this.목록열림;
      this.목록열림 = false;
      if (열려있음) { (document.activeElement as HTMLElement | null)?.blur(); }
    },
    주제표시이름,
    환경설정열기() {
      this.목록닫기();
      this.설정열림 = true;
      this.$nextTick(() => document.querySelector<HTMLElement>('.테마선택 button.선택됨')?.focus());
    },
    환경설정닫기() {
      this.설정열림 = false;
      if ((document.activeElement as HTMLElement | null)?.closest('.설정패널')) {
        (document.activeElement as HTMLElement).blur();
      }
    },
    설정토글() {
      if (this.설정열림) { this.환경설정닫기(); }
      else { this.환경설정열기(); }
    },
    단축키실행(동작: Exclude<필사단축동작, null>) {
      switch (동작) {
        case '다음':
          this.목록닫기();
          this.환경설정닫기();
          this.다음글시작();
          break;
        case '다시쓰기':
          this.목록닫기();
          this.환경설정닫기();
          this.다시쓰기();
          break;
        case '즐겨찾기': this.즐겨찾기토글(this.오늘지문.id); break;
        case '주제고르기': this.목록열기(); break;
        case '환경설정': this.환경설정열기(); break;
        case '도움말': window.location.hash = '#help'; break;
      }
    },
    선택버튼화살표(event: KeyboardEvent) {
      if (!(event.target instanceof HTMLButtonElement) || event.altKey || event.ctrlKey || event.metaKey) { return; }
      const 묶음 = event.currentTarget as HTMLElement;
      const 버튼들 = Array.from(묶음.querySelectorAll<HTMLButtonElement>('button'))
        .filter((버튼) => 버튼.getClientRects().length > 0);
      const 현재 = 버튼들.indexOf(event.target);
      if (현재 < 0) { return; }
      const 열수 = getComputedStyle(묶음).display === 'grid'
        ? getComputedStyle(묶음).gridTemplateColumns.split(' ').length : 1;
      const 다음 = event.code === 'ArrowLeft' ? 현재 - 1
        : event.code === 'ArrowRight' ? 현재 + 1
          : event.code === 'ArrowUp' ? 현재 - 열수
            : event.code === 'ArrowDown' ? 현재 + 열수
              : event.code === 'Home' ? 0
                : event.code === 'End' ? 버튼들.length - 1 : -1;
      if (다음 < 0 && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.code)) { return; }
      event.preventDefault();
      버튼들[다음]?.focus();
    },
    다른탭기록반영(event: StorageEvent) {
      if (진행기록키인가(event.key)) {
        this.기록들 = 작업합치기(this.기록들, 진행작업읽기());
      }
      if (event.key === 즐겨찾기저장키 || event.key === null) {
        this.즐겨찾기IDs = 즐겨찾기읽기();
      }
    },
    저장대기(작업: 진행작업) {
      this.미저장작업.push(작업);
      this.기록들 = 작업합치기(this.기록들, [작업]);
      this.밀린기록저장();
    },
    밀린기록저장() {
      const 저장소 = 브라우저저장소();
      while (this.미저장작업.length) {
        const 작업 = this.미저장작업[0];
        if (!진행작업저장(작업, 저장소)) { this.기록오류 = true; return; }
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
      // 첫 입력부터 곧바로 저장해 새로고침 후 입력 위치를 복원한다.
      if (this.다음기록순서 === 0 || this.미기록입력.length >= 20) { this.입력기록저장(); }
      else if (this.기록타이머 === null) {
        this.기록타이머 = setTimeout(() => this.입력기록저장(), 2000);
      }
    },
    숨김입력저장() {
      if (document.hidden) { this.입력기록저장(); }
    },
    복원할시도(): 필사시도 | undefined {
      return 지문재개시도(this.시도들, this.오늘지문.id, 본문버전(this.오늘지문.본문));
    },
    지문상태(지문: 연습지문): string {
      const 상태 = 지문입력상태(this.시도들, 지문.id, 본문버전(지문.본문));
      return 상태 === '미완료' && 지문.id === this.오늘지문.id ? '진행 중' : 상태;
    },
    지문최고(지문: 연습지문): string | null {
      const 최고 = 지문최고정타율(this.시도들, 지문.id, 본문버전(지문.본문));
      return 최고 === null ? null : 정타율표시(최고);
    },
    지문도장(지문: 연습지문): 칭찬도장종류 | null {
      return 지문도장등급(this.시도들, 지문.id, 본문버전(지문.본문));
    },
    즐겨찾기인가(지문ID: string): boolean {
      return this.즐겨찾기IDs.includes(지문ID);
    },
    즐겨찾기토글(지문ID: string) {
      const 다음 = 즐겨찾기바꾸기(this.즐겨찾기IDs, 지문ID);
      const 현재글해제 = this.글테마 === '즐겨찾기' && this.오늘지문.id === 지문ID &&
        !다음.includes(지문ID);
      this.즐겨찾기IDs = 다음;
      if (현재글해제) { this.글테마 = 지문원래테마(지문ID) ?? '시작하기'; }
      this.즐겨찾기오류 = !즐겨찾기저장(다음);
    },
    글테마바꾸기(테마: 선택주제, event?: MouseEvent) {
      if (!this.목록열림) { (event?.currentTarget as HTMLElement | undefined)?.blur(); }
      this.입력기록저장();
      const 지문 = 테마 === '즐겨찾기'
        ? 지문모음선택(this.즐겨찾기모음, this.시도들)
        : 주제지문선택(테마, this.시도들).지문;
      if (지문?.id === this.오늘지문.id &&
          (테마 === '즐겨찾기' || !this.결과화면보이기)) {
        this.글테마 = 테마;
        마지막지문저장(지문.id);
        if (this.목록열림) { this.$nextTick(() => document.querySelector<HTMLElement>('.글목록 button.선택됨')?.focus()); }
        return;
      }
      this.글테마 = 테마;
      if (!지문) { return; }
      this.오늘지문 = 지문;
      const 새로시작 = this.지문상태(지문) === '완료' || !this.복원할시도();
      this.reset(새로시작);
      if (this.목록열림) { this.$nextTick(() => document.querySelector<HTMLElement>('.글목록 button.선택됨')?.focus()); }
    },
    지문선택(지문: 연습지문, event?: MouseEvent) {
      (event?.currentTarget as HTMLElement | undefined)?.blur();
      this.목록닫기();
      const 같은지문 = 지문.id === this.오늘지문.id;
      const 완료된지문 = this.지문상태(지문) === '완료';
      if (같은지문 && !this.결과화면보이기 && !완료된지문) {
        마지막지문저장(지문.id);
        return;
      }
      this.입력기록저장();
      this.오늘지문 = 지문;
      const 새로시작 = 완료된지문 || (같은지문 && this.결과화면보이기) || !this.복원할시도();
      this.reset(새로시작);
    },
    다음글시작() {
      const 선택 = 다음미완료지문(this.오늘지문.id, this.시도들);
      this.글테마 = 선택.테마;
      this.지문선택(선택.지문);
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
      if (event.target instanceof Element && !event.target.closest('.상단')) {
        this.설정열림 = false;
      }
    },

    설정변경(변경: Partial<필사설정>) {
      this.설정 = { ...this.설정, ...변경 };
      필사설정저장(this.설정);
      const 팔레트 = 필사팔레트들[this.설정.테마];
      this.본문?.팔레트설정(팔레트);
      this.그림판?.안티앨리어싱강도설정(단계별안티앨리어싱강도[this.설정.안티앨리어싱단계]);
      this.그림판?.글꼴확대방식설정(글자크기별글꼴[this.설정.글자크기].확대방식);
      this.현재한줄칸수 = this.한줄칸수();
      this.동적배경연결();
      this.그림판?.보기설정(팔레트, this.현재한줄칸수,
        this.설정.커서깜빡임);
      this.동적배경?.setContentBottom(this.그림판?.글줄하단비율 ?? 0.5);
      this.불길위치갱신();
      this.$nextTick(() => this.화면크기변경());
    },
    불길위치갱신() {
      if (!this.그림판 || !this.본문) { return; }
      this.동적배경?.setFocus(this.그림판.화면가로비율(this.본문.위치),
        this.그림판.화면세로비율(this.본문.위치));
    },
    동적배경연결() {
      if (!움직이는테마인가(this.설정.테마)) {
        this.동적배경?.destroy();
        this.동적배경 = null;
        this.동적배경사용가능 = false;
        this.그림판?.투명배경설정(this.설정.테마 === '한지' || this.설정.테마 === '숲');
        return;
      }
      if (this.동적배경?.theme !== this.설정.테마) {
        this.동적배경?.destroy();
        this.동적배경 = null;
        this.동적배경사용가능 = false;
      }
      if (!this.동적배경) {
        const 효과 = markRaw(new 동적종이효과(
          document.getElementById('효과캔버스') as HTMLCanvasElement,
          document.getElementById('캔버스') as HTMLCanvasElement,
          this.설정.테마,
          (가능) => {
            this.동적배경사용가능 = 가능;
            this.그림판?.투명배경설정(가능);
            this.그림판?.그리기();
            this.동적배경?.setContentBottom(this.그림판?.글줄하단비율 ?? 0.5);
          },
        ));
        this.동적배경사용가능 = 효과.start();
        if (this.동적배경사용가능) { this.동적배경 = 효과; }
      }
      this.그림판?.투명배경설정(this.동적배경사용가능);
      this.동적배경?.setContentBottom(this.그림판?.글줄하단비율 ?? 0.5);
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
      this.동적배경?.setContentBottom(this.그림판?.글줄하단비율 ?? 0.5);
      this.불길위치갱신();
    },

    reset(새로시작 = false) {
      마지막지문저장(this.오늘지문.id);
      // 최근 기록의 직접 링크에서 다른 글로 옮기면 이전 글 주소가 복원을 덮어쓰지 않게 한다.
      if (this.requestedPassageId && this.requestedPassageId !== this.오늘지문.id &&
          window.location.hash.startsWith('#practice?')) {
        window.history.replaceState(window.history.state, '', '#practice');
      }
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
      const 복원 = 새로시작 ? undefined : this.복원할시도();
      if (복원) {
        this.이어쓰기원본 = { attemptId: 복원.시작.attemptId,
          inputCount: 복원.입력들.length, elapsedMs: 복원.걸린밀리초 };
        this.이어쓰기복원됨 = true;
        for (const 키 of 복원.입력들) { 본문.입력(키.code, 키.shift); }
        this.진행률 = 본문.진행률;
        this.입력상태 = 본문.방금오타 ? '오타' : '진행';
        if (본문.끝) {
          const 걸린밀리초 = Math.max(1000, 복원.걸린밀리초);
          this.완료초 = Math.max(1, Math.round(걸린밀리초 / 1000));
          this.총입력타수 = 본문.입력타수;
          this.정타수 = 본문.유효타수;
          this.종전최고정타율 = 지문최고정타율(this.시도들, this.오늘지문.id,
            본문버전(this.오늘지문.본문), 복원.시작.attemptId);
          this.시도ID = 복원.시작.attemptId;
          this.결과화면보이기 = true;
          this.저장대기(시도완료(복원.시작.attemptId, 걸린밀리초, this.총입력타수, this.정타수));
        }
      }
      const 캔버스 = document.getElementById('캔버스') as HTMLCanvasElement;
      const ctx = 캔버스.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
      this.현재한줄칸수 = this.한줄칸수();
      const 그림판 = markRaw(new 그림판틀(ctx, 본문, {
        팔레트, 한줄칸수: this.현재한줄칸수,
        최소높이: 210,
        커서깜빡임: this.설정.커서깜빡임,
        안티앨리어싱: 단계별안티앨리어싱강도[this.설정.안티앨리어싱단계],
        글꼴확대방식: 글자크기별글꼴[this.설정.글자크기].확대방식,
        영문글꼴: false,
      }));
      this.그림판 = 그림판;
      this.동적배경연결();
      this.동적배경?.shuffleCloud();
      그림판.그리기();
      this.동적배경?.setContentBottom(그림판.글줄하단비율);
      this.불길위치갱신();
      this.$nextTick(() => {
        this.화면크기변경();
        const 종이 = document.querySelector('.종이');
        if (종이) { 종이.scrollTop = 0; }
      });
      const self = this;
      window.onkeydown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
          if (self.목록열림) { e.preventDefault(); self.목록닫기(); return; }
          if (self.설정열림) { e.preventDefault(); self.환경설정닫기(); return; }
          if ((document.activeElement as HTMLElement | null)?.closest('button, a')) {
            (document.activeElement as HTMLElement).blur();
          }
          return;
        }
        if (e.code === 'Tab' && self.목록열림) {
          const 버튼들 = Array.from(document.querySelectorAll<HTMLElement>('.선택패널 button'))
            .filter((버튼) => 버튼.getClientRects().length > 0);
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
        const 대상 = e.target as HTMLElement | null;
        const 동작 = 필사단축키(e, self.결과화면보이기);
        if (동작 && e.altKey) {
          e.preventDefault();
          self.단축키실행(동작);
          return;
        }
        if (대상?.closest('input, select, textarea, [contenteditable="true"]')) { return; }
        if (self.목록열림 || self.설정열림) { return; }
        const 조작요소 = 대상?.closest('button, summary, a');
        if (동작 && !조작요소) {
          e.preventDefault();
          self.단축키실행(동작);
          return;
        }
        if (조작요소 || self.결과화면보이기) { return; }
        if (e.code.startsWith('Shift') || e.code.startsWith('Control') ||
            e.code.startsWith('Alt') || e.code.startsWith('Meta') ||
            e.getModifierState('Control') || e.getModifierState('Alt') || e.getModifierState('Meta') ||
            !/^(Key[A-Z]|Digit[0-9]|Space|Enter|Backspace|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(e.code)) {
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
        const 이전획 = 본문.진행획수;
        const 이전위치 = 본문.위치;
        const 이전글자 = 본문.지문글자(이전위치);
        const 바뀐위치 = 본문.입력(e.code, e.shiftKey);
        self.입력기록추가({ code: e.code, shift: e.shiftKey,
          elapsedMs: Math.max(0, Math.round(performance.now() - self.시작시각!)) });
        self.입력상태 = 본문.방금오타 ? '오타' : 직전오타 ? '정정' : '진행';
        if (본문.방금오타) {
          self.동적배경?.mistake();
          그림판.오타효과시작(본문.위치);
        } else {
          그림판.오타효과중지(false);
          그림판.변경그리기(바뀐위치);
        }
        self.진행률 = 본문.진행률;
        if (본문.진행획수 > 이전획) {
          const 문장끝 = 본문.끝 || ((이전글자.다음행 ||
            '.!?。！？'.includes(String.fromCodePoint(이전글자.코드[0]))) &&
            (이전위치.행 !== 본문.위치.행 || 이전위치.열 !== 본문.위치.열));
          self.동적배경?.typing(그림판.화면가로비율(이전위치),
            그림판.화면세로비율(이전위치), 문장끝);
          if (!본문.끝) { self.불길위치갱신(); }
        }
        if (본문.끝) {
          const 걸린밀리초 = Math.max(1000, performance.now() - self.시작시각);
          self.완료초 = Math.max(1, Math.round(걸린밀리초 / 1000));
          self.총입력타수 = 본문.입력타수;
          self.정타수 = 본문.유효타수;
          self.종전최고정타율 = 지문최고정타율(self.시도들, self.오늘지문.id,
            본문버전(self.오늘지문.본문), self.시도ID);
          self.입력기록저장();
          self.저장대기(시도완료(self.시도ID, 걸린밀리초, self.총입력타수, self.정타수));
          self.결과화면보이기 = true;
          self.$nextTick(() => {
            const 종이 = 캔버스.closest('.종이');
            if (종이) { 종이.scrollTop = 0; }
          });
        } else {
          const 커서세로 = 그림판.커서세로위치;
          if (커서세로 !== null) {
            const 종이 = 캔버스.closest('.종이');
            if (종이) {
              const 해상도배율 = 글자크기별글꼴[self.설정.글자크기].해상도배율;
              const 화면세로 = 캔버스.getBoundingClientRect().top +
                커서세로 * 해상도배율 * 캔버스.clientHeight / 캔버스.height;
              const 경계 = 종이.getBoundingClientRect().bottom - 36;
              if (화면세로 > 경계) { 종이.scrollTop += 화면세로 - 경계; }
            }
          }
        }
      };
    },
  },
  mounted() {
    document.title = '글숨 · 한글 타이핑 필사';
    this.설정 = 필사설정읽기();
    this.기록들 = 진행작업읽기();
    this.즐겨찾기IDs = 즐겨찾기읽기();
    const 요청후보 = this.requestedPassageId ? 지문찾기(this.requestedPassageId) : undefined;
    const 요청지문 = 요청후보 && (!정식사이트 || 공개주제인가(요청후보.테마)) ? 요청후보 : undefined;
    const 선택 = 요청지문 ?? 첫진입지문선택(this.시도들, 마지막지문읽기());
    this.오늘날짜 = 날짜키(new Date());
    this.글테마 = 선택.테마;
    this.오늘지문 = 선택.지문;
    document.addEventListener('pointerdown', this.설정밖클릭);
    document.addEventListener('visibilitychange', this.날짜변경확인);
    document.addEventListener('visibilitychange', this.숨김입력저장);
    window.addEventListener('pagehide', this.입력기록저장);
    window.addEventListener('storage', this.다른탭기록반영);
    window.addEventListener('resize', this.화면크기변경);
    if (typeof ResizeObserver !== 'undefined') {
      this.폭관찰기 = markRaw(new ResizeObserver(() => this.화면크기변경()));
      this.폭관찰기.observe(document.querySelector('.캔버스영역')!);
    }
    this.날짜확인타이머 = setInterval(this.날짜변경확인, 60000);
    this.reset(this.지문상태(this.오늘지문) === '완료');
  },
  beforeUnmount() {
    document.title = '글숨 · 글꼴 편집기';
    document.removeEventListener('pointerdown', this.설정밖클릭);
    document.removeEventListener('visibilitychange', this.날짜변경확인);
    document.removeEventListener('visibilitychange', this.숨김입력저장);
    window.removeEventListener('pagehide', this.입력기록저장);
    window.removeEventListener('storage', this.다른탭기록반영);
    window.removeEventListener('resize', this.화면크기변경);
    this.폭관찰기?.disconnect();
    this.폭관찰기 = null;
    if (this.날짜확인타이머 !== null) { clearInterval(this.날짜확인타이머); }
    this.입력기록저장();
    window.onkeydown = null;
    this.그림판?.종료();
    this.동적배경?.destroy();
    this.동적배경 = null;
  },
  computed: {
    현재삽화(): string | undefined {
      return 지문삽화들[this.오늘지문.id];
    },
    어두운삽화테마(): boolean {
      return 어두운삽화테마들.has(this.설정.테마);
    },
    이번도장(): 칭찬도장종류 | null {
      return this.결과화면보이기 ? 정타도장(this.정타수, this.총입력타수) : null;
    },
    시도들(): 필사시도[] {
      return 시도목록(this.기록들);
    },
    즐겨찾기모음(): 연습지문[] {
      const 지문들 = 모은지문들(this.즐겨찾기IDs);
      return 정식사이트 ? 지문들.filter((지문) => {
        const 주제 = 지문원래테마(지문.id);
        return 주제 !== undefined && 공개주제인가(주제);
      }) : 지문들;
    },
    원래글테마(): 지문테마 {
      return 지문원래테마(this.오늘지문.id) ?? '시작하기';
    },
    완료리듬막대들(): Array<리듬막대 | null> {
      const 시도 = this.시도들.find((후보) => 후보.시작.attemptId === this.시도ID);
      return 시도 ? 완료리듬그래프(this.오늘지문.본문, 시도.입력들,
        시도.완료?.elapsedMs ?? 시도.걸린밀리초) : 빈리듬그래프();
    },
    주제완료도(): Record<선택주제, { 완료: number; 전체: number; 비율: number }> {
      return Object.fromEntries(this.글테마선택지.map((테마) => {
        const 현황 = 테마 === '즐겨찾기'
          ? 지문모음완료현황(this.즐겨찾기모음, this.시도들)
          : 주제완료현황(테마, this.시도들);
        return [테마, { ...현황, 비율: 현황.전체 ? 현황.완료 / 현황.전체 * 100 : 0 }];
      })) as Record<선택주제, { 완료: number; 전체: number; 비율: number }>;
    },
    현재지문들(): readonly 연습지문[] {
      return this.글테마 === '즐겨찾기' ? this.즐겨찾기모음 : 테마별지문들[this.글테마];
    },
    걸린시간() {
      return `${Math.floor(this.완료초 / 60)}분 ${this.완료초 % 60}초`;
    },
    정타율(): string {
      return 정타율(this.정타수, this.총입력타수);
    },
    이번최고기록(): boolean {
      return 이번이최고정타율인가(this.정타수, this.총입력타수, this.종전최고정타율);
    },
    종전최고표시(): string {
      return this.종전최고정타율 === null ? '' : 정타율표시(this.종전최고정타율);
    },
    정타율차이(): number {
      return this.종전최고정타율 === null || this.총입력타수 <= 0 ? 0
        : Math.round((this.정타수 / this.총입력타수 * 100 - this.종전최고정타율) * 100) / 100;
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

.필사실:is([data-theme='매트릭스'], [data-theme='PC통신']) .지문머리 h2 {
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 700;
  letter-spacing: -.02em;
}
.필사실:is([data-theme='매트릭스'], [data-theme='PC통신']) .브랜드문양,
.필사실:is([data-theme='매트릭스'], [data-theme='PC통신']) .종이 {
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
.최근버튼, .도움말버튼 { color: var(--보조글); font-size: 13px; text-decoration: none; }
.최근버튼:hover, .도움말버튼:hover { color: var(--글); text-decoration: underline; text-underline-offset: 4px; }
.최근버튼:focus-visible, .도움말버튼:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
.브랜드 { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.브랜드문양 { width: 27px; height: 27px; --글숨문양색: var(--글); --글숨문양획색: var(--화면); }
.브랜드:focus-visible { outline: 2px solid var(--강조); outline-offset: 4px; }
.브랜드글자 { display: flex; align-items: center; gap: 9px; color: var(--글); }
.브랜드타이틀 { display: block; width: 49px; height: auto; color: var(--글); }
.브랜드글자 small { color: var(--글); font-size: 14px; }
.설정버튼 { padding: 8px 11px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--보조글); font-size: 13px; cursor: pointer; }
.설정버튼:hover { border-color: var(--강조); color: var(--글); }
.설정버튼 span { margin-left: 5px; font-size: 15px; }
.설정패널 { position: absolute; z-index: 10; top: 72px; right: 0; box-sizing: border-box; width: min(360px, calc(100vw - 36px)); max-height: calc(100dvh - 90px); padding: 22px; overflow-y: auto; overscroll-behavior: contain; border: 1px solid var(--테두리); border-radius: 4px; background: var(--종이); box-shadow: 0 15px 36px rgba(0, 0, 0, .18); }
.설정머리 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.설정머리 strong { font-size: 17px; }
.설정닫기 { border: 0; background: none; color: var(--보조글); font-size: 24px; line-height: 1; cursor: pointer; }
.설정패널 fieldset { min-width: 0; margin: 0 0 18px; padding: 0; border: 0; }
.설정패널 legend { margin-bottom: 9px; color: var(--보조글); font-size: 13px; font-weight: 700; }
.테마선택 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.테마버튼 { display: flex; align-items: center; flex-direction: column; gap: 7px; padding: 7px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 13px; cursor: pointer; }
.테마버튼:last-child:nth-child(3n + 1) { grid-column: 2; }
.테마버튼.선택됨, .설정선택 button.선택됨 { border-color: var(--강조); background: var(--선택바탕); }
.테마견본 { display: grid; place-items: center; width: 100%; height: 38px; background: #fff; color: #454037; font-family: 'AppleMyungjo', 'Batang', serif; font-size: 19px; }
.테마견본[data-theme='한지'] { background: #f8f4ed url('@/assets/hanji-paper.webp') center / cover; color: #454037; }
.테마견본[data-theme='새벽'] { background: #fafcfc; color: #30444f; }
.테마견본[data-theme='밤'] { background: #222c31; color: #e2e7df; }
.테마견본[data-theme='숲'] { background: #19392f url('@/assets/distant-forest.webp') center / cover; color: #e6efe4; }
.테마견본[data-theme='청보리'] { background: #1e3423; color: #d3df8b; }
.테마견본[data-theme='폭포'] { background: linear-gradient(160deg, #123039 45%, #315965 74%, #7f9ca3); color: #edf4ef; }
.테마견본[data-theme='라벤더'] { background: #fcfaff; color: #675184; }
.테마견본[data-theme='커피'] { background: #352922; color: #d8b58e; }
.테마견본[data-theme='촛불'] { background: radial-gradient(circle at 74% 68%, #583323, #181417 68%); color: #f4c892; }
.테마견본[data-theme='매트릭스'] { background: #08190e; color: #9affaa; text-shadow: 0 0 7px rgba(99, 245, 131, .65); }
.테마견본[data-theme='PC통신'] { background: #102287; color: #fff; }
.테마견본[data-theme='서가'] { background: linear-gradient(135deg, #16404d 67%, #dda853 67%); color: #fbf5dd; }
.테마견본[data-theme='수면과 파문'] {
  background: linear-gradient(180deg, #07171a 0 62%, #244443 80%, #b29055 100%);
  color: #f0efdc;
}
.테마견본[data-theme='빗방울'] {
  background: linear-gradient(145deg, #08151e 45%, #284552 70%, #789ba9 100%);
  color: #f3f7f4;
}
.테마견본[data-theme='구름'] {
  background: url('@/assets/cumulus-cloud.webp') center 60% / cover no-repeat, #0755a9;
  color: #203e51;
}
.테마견본[data-theme='모닥불'] {
  background: radial-gradient(circle at 54% 100%, #a85a2d, #38221b 48%, #1d1211 85%);
  color: #fff0dc;
}
.테마견본[data-theme='인센스'] {
  background: radial-gradient(circle at 70% 95%, #78634d, #30343a 42%, #12151b 85%);
  color: #f4efe1;
}
.테마견본[data-theme='오로라'] {
  background: linear-gradient(135deg, #071421 12%, #177c96 29%, #319c53 45%, #6746a2 63%, #a83479 78%, #130f2c 100%);
  color: #f2fbf5;
}
.테마견본[data-theme='별똥별'] {
  background: #080e1e url('@/assets/milky-way.webp') center / cover;
  color: #faf7eb;
}
.설정선택 { display: flex; gap: 7px; }
.설정선택 button { min-width: 72px; padding: 8px 13px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 13px; cursor: pointer; }
.가장자리선택 input { display: block; width: 100%; margin: 0; accent-color: var(--강조); cursor: pointer; }
.가장자리눈금 { display: flex; justify-content: space-between; margin: 2px 7px 0; }
.가장자리눈금 span { width: 2px; height: 4px; background: var(--테두리); }
.가장자리끝표시 { display: flex; justify-content: space-between; margin-top: 4px; color: var(--옅은글); font-size: 12px; }
.설정안내 { margin: 3px 0 0; color: var(--옅은글); font-size: 12px; }

.분류, .마침꼬리 {
  color: var(--강조);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
}
.작업공간 { padding-bottom: 84px; }
.선택머리 { display: flex; justify-content: space-between; align-items: end; gap: 20px; text-align: left; }
.구역번호 { color: var(--강조); font-size: 13px; font-weight: 700; letter-spacing: .08em; }
.구역번호 span { padding: 0 5px; color: var(--옅은글); }
.선택머리 h2 { margin: 9px 0 0; font-size: 18px; font-weight: 650; letter-spacing: -.045em; }
.선택제목줄 { display: flex; align-items: center; gap: 8px; }
.주제목록 { width: min(100%, 542px); margin-top: 18px; }
.주제묶음 + .주제묶음 { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--테두리); }
.주제묶음 h3 { margin: 0 0 10px; color: var(--글); font-size: 13px; font-weight: 700; }
.글테마선택 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.글테마선택 button {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 10px 17px 13px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
  color: var(--보조글);
  font-size: 13px;
  cursor: pointer;
}
.글테마선택 .주제이름 { position: relative; z-index: 1; }
.주제진행바탕 {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--진행바탕);
}
.주제진행바탕 span { display: block; height: 100%; background: var(--강조); }
.글테마선택 button.선택됨 { border-color: var(--강조); background: var(--선택바탕); color: var(--글); font-weight: 700; }
.지문서랍 { margin-top: 21px; }
.지문서랍 h3 { margin: 0; color: var(--강조); font-size: 13px; font-weight: 600; }
.지문서랍 h3 span { margin-left: 8px; color: var(--옅은글); font-weight: 400; }
.글목록 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-top: 13px; }
.글목록 .지문선택버튼 {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  gap: 5px;
  width: 100%;
  min-height: 57px;
  padding: 11px 13px;
  border: 1px solid var(--테두리);
  border-radius: 3px;
  background: var(--선택안함);
  color: var(--글);
  text-align: left;
  cursor: pointer;
}
.글목록 .지문선택버튼:hover, .글목록 .지문선택버튼.선택됨 { border-color: var(--강조); background: var(--선택바탕); }
.글목록 .지문선택버튼.도장있음 { padding-right: 55px; }
.글목록 .지문목록도장 { position: absolute; top: 50%; right: 8px; transform: translateY(-50%) rotate(-9deg); }
.지문목록머리 { display: block; width: 100%; min-width: 0; }
.글목록 strong { font-size: 13px; }
.지문목록머리 strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.글목록 .지문설명 { max-width: 100%; overflow: hidden; color: var(--보조글); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.글목록 em { font-style: normal; }
.글목록 em.완료 { color: var(--완료색); font-weight: 700; }
.글목록 .최고정타율 { color: var(--보조글); font-size: inherit; font-variant-numeric: tabular-nums; }
.빈즐겨찾기 { grid-column: 1 / -1; margin: 0; padding: 14px 2px; color: var(--보조글); font-size: 13px; line-height: 1.6; }
.종이 {
  margin-top: 22px;
  padding: 30px clamp(24px, 5.4vw, 73px) 27px;
  border: 1px solid var(--연테두리);
  border-radius: 3px;
  background: var(--종이);
  box-shadow: 0 22px 60px rgba(81, 71, 54, .075), 0 2px 7px rgba(81, 71, 54, .035);
}
.종이상단 { display: flex; justify-content: flex-end; align-items: center; color: var(--옅은글); font-size: 12px; letter-spacing: .08em; }
.지문머리 { padding-top: 43px; text-align: center; }
.분류 { margin: 0 0 13px; }
.지문머리 h2 {
  margin: 0;
  font-family: 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', serif;
  font-size: clamp(28px, 3vw, 37px);
  font-weight: 500;
  letter-spacing: -.04em;
}
.본문즐겨찾기 { display: grid; place-items: center; flex: none; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--보조글); font-size: 22px; line-height: 1; cursor: pointer; }
.본문즐겨찾기.선택됨 { color: var(--강조); }
.본문즐겨찾기:hover { background: var(--선택바탕); }
.출처 { margin: 14px 0 0; color: var(--옅은글); font-size: 13px; }
.즐겨찾기안내 { margin: 7px 0 0; color: var(--오류색); font-size: 12px; }
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
#효과캔버스 {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 2px 2px 0 0;
  z-index: 0;
}
.필사실[data-theme='커피'] .종이,
.필사실[data-theme='촛불'] .종이 { z-index: 2; }
.종이외피.동적배경작동 .종이 { background: transparent; }
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
.진행문구 { display: flex; align-items: center; gap: 9px; color: var(--보조글); font-size: 13px; }
.상태표시 { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--옅은글); }
.상태표시.오류 { background: var(--오류색); }
.상태표시.완료 { background: var(--완료색); }
.그래프설명 { margin-left: auto; color: var(--보조글); font-size: 12px; white-space: nowrap; }
.진행숫자 { min-width: 36px; margin-left: auto; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums; }
.진행막대 { height: 2px; margin-top: 13px; overflow: hidden; background: var(--진행선); }
.진행막대 span { display: block; height: 100%; background: var(--진행활성); transition: width .2s ease; }
.리듬그래프 {
  display: grid;
  grid-template-columns: repeat(100, minmax(0, 1fr));
  align-items: end;
  gap: 1px;
  height: 38px;
  margin-top: 12px;
  border-bottom: 1px solid var(--진행선);
}
.리듬칸 { position: relative; height: 100%; min-width: 0; }
.리듬막대 { position: absolute; right: 0; bottom: 0; left: 0; display: block; background: var(--진행활성); }
.리듬막대.오타 { background: var(--오류색); }
.필사실[data-theme='한지'] .리듬막대:not(.오타),
.필사실[data-theme='새벽'] .리듬막대:not(.오타) { background: var(--강조); }
.기록안내 { margin: 10px 0 0; color: var(--보조글); font-size: 12px; }
.기록안내[role="alert"] { color: var(--오류색); }
.진행아래 { display: flex; justify-content: space-between; align-items: center; gap: 20px; max-width: 800px; margin: 19px auto 0; color: var(--보조글); font-size: 12px; }
.글자버튼 { padding: 4px 0; border: 0; background: none; color: var(--강조); font-size: 13px; cursor: pointer; }
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
.마침머리 { display: flex; align-items: center; gap: 10px; }
.마침머리 .마침꼬리 { margin: 0; }
.마침내용 { min-width: 0; }
.마침통계 { display: flex; flex-wrap: wrap; gap: 12px 26px; margin: 24px 0 0; padding: 15px 0 0; border-top: 1px solid var(--진행선); }
.마침통계 div { display: flex; flex-direction: column; gap: 5px; }
.마침통계 dt { color: var(--옅은글); font-size: 12px; }
.마침통계 dd { margin: 0; color: var(--보조글); font-size: 13px; font-variant-numeric: tabular-nums; }
.기록비교묶음 { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 6px 18px; width: 100%; margin-top: 10px; text-align: left; }
.개인최고안내 { display: flex; align-items: center; gap: 7px; margin: 0; color: var(--글); font-size: 12px; }
.정타율비교 { margin: 0; color: var(--보조글); font-size: 12px; font-variant-numeric: tabular-nums; }
.정타율비교 strong { color: var(--글); }
.마침동작 { display: flex; flex-direction: column; align-items: center; gap: 9px; margin-left: auto; }
.주버튼 { min-width: 132px; padding: 11px 14px; border: 1px solid var(--강조); border-radius: 2px; background: var(--강조); color: var(--역글); font-size: 13px; cursor: pointer; }
.주버튼:hover { background: var(--강조호버); }
.주버튼 span { margin-left: 12px; }
button:focus-visible { outline: 2px solid var(--강조); outline-offset: 3px; }
/* 글 선택, 입력, 결과가 같은 높이 안에서 이어지는 작업대 */
.페이지 { display: flex; flex-direction: column; height: 100dvh; min-height: 680px; }
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
.주제목록 { width: 100%; max-height: min(40dvh, 310px); overflow-y: auto; overscroll-behavior: contain; }
.글테마선택 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.글테마선택 button { padding: 8px 5px 11px; font-size: 13px; }
.지문서랍 { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-top: 20px; }
.글목록 { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 6px; overflow-y: auto; overscroll-behavior: contain; padding-right: 3px; }
.글목록 .지문선택버튼 { flex: none; min-height: 51px; padding: 9px 11px; }
.필사패널 {
  /* 저장된 색상 테마에서 재질을 파생시켜 테마 변경을 즉시 반영한다. */
  --타자기몸체: var(--선택바탕);
  --타자기금속: var(--강조);
  --타자기받침: var(--테두리);
  --타자기그림자: color-mix(in srgb, var(--글) 12%, transparent);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding-bottom: 9px;
}
.필사실[data-theme='매트릭스'] .종이 { box-shadow: inset 0 0 38px rgba(43, 202, 82, .06); }
.필사실[data-theme='PC통신'] .종이 { box-shadow: none; }
.종이외피 { position: relative; flex: 1; min-height: 220px; margin: 0 12px; }
.종이 {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  height: 100%;
  margin: 0;
  padding: 18px clamp(18px, 3vw, 38px) 28px;
  border-radius: 2px 2px 0 0;
  box-shadow: 0 2px 10px var(--타자기그림자);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.필사실[data-theme='한지'] .종이 {
  background: linear-gradient(rgba(255, 255, 255, .35), rgba(255, 255, 255, .35)),
    url('@/assets/hanji-paper.webp') center / cover;
}
.필사실[data-theme='숲'] .종이::before {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 30%;
  background: url('@/assets/distant-forest.webp') center 54% / cover no-repeat;
  filter: brightness(.6);
  opacity: .86;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 42%);
  mask-image: linear-gradient(to bottom, transparent, #000 42%);
  pointer-events: none;
  z-index: -1;
}
.지문머리 { padding-top: 12px; }
.지문머리내용 { min-width: 0; }
.지문머리.도장찍힘 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(16px, 2vw, 30px);
}
.도장묶음 { display: flex; align-items: center; flex: none; gap: 8px; }
.도장묶음 .개인최고도장 { animation-delay: .18s; }
.분류 { margin-bottom: 8px; }
.지문머리 h2 { font-size: clamp(24px, 2.5vw, 30px); }
.지문삽화자리 {
  position: absolute;
  top: 49px;
  left: clamp(18px, 3vw, 38px);
  width: 235px;
  height: 118px;
  color: var(--보조글);
  pointer-events: none;
}
.지문삽화자리.어두운삽화 { color: var(--글); }
.지문삽화자리 svg {
  display: block;
  width: 100%;
  height: 100%;
}
.출처 { margin-top: 7px; }
.가는선 { margin-top: 18px; }
.캔버스영역 { margin-top: 16px; }
.진행판 {
  position: relative;
  flex: none;
  max-width: none;
  margin: -1px 0 0;
  padding: 17px 23px 12px;
  border: 1px solid var(--타자기받침);
  border-radius: 13px 13px 29px 29px;
  background: var(--타자기몸체);
  box-shadow: inset 0 2px 0 var(--종이), 0 7px 0 var(--타자기받침), 0 14px 20px var(--타자기그림자);
}
.타자기통풍구 {
  width: 74px;
  height: 5px;
  margin: 14px auto 0;
  background: repeating-linear-gradient(90deg, var(--타자기금속) 0 2px, transparent 2px 6px);
  opacity: .45;
}
.진행판 .글자버튼, .진행판 .주버튼 {
  min-height: 38px;
  padding: 8px 15px;
  border: 1px solid var(--타자기받침);
  border-radius: 20px;
  box-shadow: 0 3px 0 var(--타자기받침);
  transition: transform .12s ease, box-shadow .12s ease;
}
.진행판 .글자버튼 { background: var(--종이); color: var(--글); }
.진행판 .마침통계 dt { color: var(--보조글); }
.진행판 .기록안내[role="alert"] { color: color-mix(in srgb, var(--오류색) 80%, var(--글)); }
.진행판 .글자버튼:hover { border-color: var(--타자기금속); text-decoration: none; }
.진행판 .글자버튼:active, .진행판 .주버튼:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--타자기받침); }
.진행아래 { margin-top: 9px; }
.마침 { max-width: none; gap: 18px; margin-top: 10px; padding-top: 11px; }
.마침내용 { flex: 1; }
.마침꼬리 { margin: 0; }
.마침통계 { gap: 8px 22px; margin-top: 10px; padding-top: 10px; }
.마침동작 { flex: none; }

@media (max-width: 850px) {
  .페이지 { padding: 0 14px; min-height: 660px; }
  .상단 { height: 56px; }
  .상단동작 { gap: 8px; }
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
  .모바일선택줄 div span { color: var(--옅은글); font-size: 12px; }
  .모바일선택줄 strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
  .모바일선택줄 button { flex: none; padding: 8px 10px; border: 1px solid var(--테두리); border-radius: 3px; background: var(--선택안함); color: var(--글); font-size: 13px; cursor: pointer; }
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
  .글목록 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; }
  .글목록 .지문선택버튼 { min-height: 56px; }
  .필사패널 { flex: 1; padding-top: 3px; }
  .종이외피 { margin: 0 6px; }
  .종이 { padding: 13px 16px 22px; }
  .지문머리 { padding-top: 8px; }
  .지문머리.도장찍힘 { gap: 12px; }
  .도장묶음 { gap: 5px; }
  .지문머리 h2 { font-size: 25px; }
  .지문삽화자리 { top: 69px; left: 10px; width: 90px; height: 45px; }
  .가는선 { margin-top: 15px; }
  .캔버스영역 { margin-top: 14px; }
  .진행판 { padding: 13px 14px 10px; border-radius: 10px 10px 22px 22px; }
  .타자기통풍구 { margin-top: 11px; height: 4px; }
  .진행아래 { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .진행판 .글자버튼, .진행판 .주버튼 { min-height: 44px; padding: 8px 12px; }
  .마침 { align-items: start; flex-wrap: wrap; gap: 8px; }
  .마침내용 { flex-basis: 100%; }
  .마침통계 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
  .마침통계 dd { font-size: 12px; }
  .마침동작 { width: auto; margin: 0; }
  .주버튼 { padding: 8px 11px; }
}

@media (max-width: 600px) {
  .브랜드글자 small { display: none; }
  .상단동작 { gap: 6px; }
  .최근버튼, .도움말버튼, .설정버튼 { white-space: nowrap; }
  .지문머리.도장찍힘 { grid-template-columns: minmax(0, 1fr); }
  .도장묶음 { justify-self: end; }
}

@media (max-width: 380px) {
  .지문삽화자리 { left: 7px; width: 74px; height: 37px; }
  .그래프설명 { display: none; }
  .진행아래 > span { display: none; }
  .마침통계 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .진행막대 span { transition: none; }
  .진행판 .글자버튼, .진행판 .주버튼 { transition: none; }
}

</style>
