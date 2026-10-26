const 측정ID = 'G-HTCN1QLMBR';
const 수집주소 = new Set(['https://dailytyping.com', 'https://type.hatemogi.com']);

type 화면 = 'intro' | 'practice' | 'recent' | 'help' | 'font-editor' | 'masks' | 'about';
type 이벤트값 = string | number | boolean;
type 명령 = IArguments | [string, ...unknown[]];

declare global {
  interface Window { dataLayer?: 명령[] }
}

let 시작됨 = false;
let 마지막화면: 화면 | null = null;

function 전송가능(): boolean {
  return typeof window !== 'undefined' && 수집주소.has(window.location.origin);
}

function gtag(..._args: unknown[]): void {
  window.dataLayer!.push(arguments);
}

export function 분석시작(): void {
  if (!전송가능() || 시작됨) { return; }
  시작됨 = true;
  window.dataLayer = window.dataLayer || [];
  gtag('js', new Date());
  // 해시로 화면을 바꾸므로 페이지 조회는 화면 전환 시 직접 기록한다.
  gtag('config', 측정ID, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${측정ID}`;
  document.head.appendChild(script);
}

const 화면정보: Record<화면, { 경로: string; 제목: string }> = {
  intro: { 경로: '#', 제목: '글숨 · 한 글자씩, 마음을 고르다.' },
  practice: { 경로: '#practice', 제목: '글숨 · 한글 타이핑 필사' },
  recent: { 경로: '#recent', 제목: '글숨 · 최근 완성한 글' },
  help: { 경로: '#help', 제목: '글숨 · 도움말' },
  'font-editor': { 경로: '/font-editor', 제목: '글숨 · 글꼴 편집기' },
  masks: { 경로: '/masks', 제목: '글숨 · 마스크 편집기' },
  about: { 경로: '/about', 제목: '글숨 · 소개' },
};

export function 화면조회(화면: 화면): void {
  if (!전송가능() || 마지막화면 === 화면) { return; }
  분석시작();
  마지막화면 = 화면;
  const 정보 = 화면정보[화면];
  const 경로 = 정보.경로.startsWith('#')
    ? `${window.location.pathname}${정보.경로}` : 정보.경로;
  gtag('event', 'page_view', {
    page_title: 정보.제목,
    page_location: `${window.location.origin}${경로}`,
    app_screen: 화면,
  });
}

export function 이벤트기록(이름: string, 값: Record<string, 이벤트값> = {}): void {
  if (!전송가능()) { return; }
  분석시작();
  gtag('event', 이름, 값);
}
