import { beforeEach, afterEach, expect, it, vi } from 'vitest';

const 원래창 = globalThis.window;
const 원래문서 = globalThis.document;

beforeEach(() => { vi.resetModules(); });
afterEach(() => {
  vi.stubGlobal('window', 원래창);
  vi.stubGlobal('document', 원래문서);
});

function 환경(origin: string) {
  const scripts: Array<{ async: boolean; src: string }> = [];
  const win = { location: { origin, pathname: '/' }, dataLayer: [] as IArguments[] };
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', {
    createElement: () => ({ async: false, src: '' }),
    head: { appendChild: (script: { async: boolean; src: string }) => scripts.push(script) },
  });
  return { win, scripts };
}

it('실서비스에서 태그를 한 번 설치하고 해시 화면 조회를 중복 없이 보낸다', async () => {
  const { win, scripts } = 환경('https://dailytyping.com');
  const { 분석시작, 화면조회, 이벤트기록 } = await import('@/analytics');
  분석시작();
  화면조회('intro');
  화면조회('intro');
  화면조회('practice');
  이벤트기록('practice_start', { passage_id: 'ABCDEFGHIJKL', resumed: false });
  expect(scripts).toEqual([{ async: true,
    src: 'https://www.googletagmanager.com/gtag/js?id=G-HTCN1QLMBR' }]);
  expect(win.dataLayer.map((args) => Array.from(args))).toMatchObject([
    ['js', expect.any(Date)],
    ['config', 'G-HTCN1QLMBR', { send_page_view: false }],
    ['event', 'page_view', { page_location: 'https://dailytyping.com/#' }],
    ['event', 'page_view', { page_location: 'https://dailytyping.com/#practice' }],
    ['event', 'practice_start', { passage_id: 'ABCDEFGHIJKL', resumed: false }],
  ]);
});

it('개발 주소에서는 태그와 이벤트를 전송하지 않는다', async () => {
  const { win, scripts } = 환경('http://localhost:8081');
  const { 분석시작, 화면조회, 이벤트기록 } = await import('@/analytics');
  분석시작();
  화면조회('practice');
  이벤트기록('practice_complete', { duration_seconds: 42 });
  expect(scripts).toHaveLength(0);
  expect(win.dataLayer).toHaveLength(0);
});
