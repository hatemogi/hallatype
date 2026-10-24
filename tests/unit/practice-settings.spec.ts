import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 기본필사설정, 단계별안티앨리어싱강도, 필사설정읽기, 필사설정저장, 필사팔레트들 } from '@/practice-settings';

it('필사 설정을 저장하고 잘못된 저장값은 기본값으로 복구한다', () => {
  const 값들 = new Map<string, string>();
  const storage = {
    getItem: (key: string) => 값들.get(key) ?? null,
    setItem: (key: string, value: string) => { 값들.set(key, value); },
  };
  expect(필사설정읽기(storage)).toEqual(기본필사설정);

  const 설정 = { 테마: '밤' as const, 글자크기: '크게' as const,
    커서깜빡임: false, 안티앨리어싱단계: 4 as const };
  필사설정저장(설정, storage);
  expect(필사설정읽기(storage)).toEqual(설정);
  필사설정저장({ ...설정, 글자크기: '작게' }, storage);
  expect(필사설정읽기(storage).글자크기).toBe('작게');
  for (const 테마 of ['벚꽃', '숲', '라벤더', '매트릭스', 'PC통신', '호박색 모니터'] as const) {
    필사설정저장({ ...설정, 테마 }, storage);
    expect(필사설정읽기(storage).테마).toBe(테마);
  }
  값들.set([...값들.keys()][0], JSON.stringify({ 테마: '밤', 글자크기: '크게', 커서깜빡임: false }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(2);

  const 키 = [...값들.keys()][0];
  값들.set(키, '{');
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
  값들.set(키, JSON.stringify({ 안티앨리어싱단계: 6 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(2);
  값들.set(키, JSON.stringify({ 안티앨리어싱: 300 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(4);
  값들.set(키, JSON.stringify({ 안티앨리어싱단계: 5 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(4);
  값들.set(키, JSON.stringify({ 테마: '알 수 없음', 글자크기: '매우 크게', 커서깜빡임: 1 }));
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
});

it('슬라이더 다섯 눈금의 가운데가 기존 보통 강도다', () => {
  expect(단계별안티앨리어싱강도).toEqual([0, 50, 100, 200, 300]);
  expect(단계별안티앨리어싱강도[기본필사설정.안티앨리어싱단계]).toBe(100);
});

it('모든 필사 테마의 캔버스 글자색은 종이와 충분히 구분된다', () => {
  const 휘도 = (색: readonly number[]) => 색.slice(0, 3)
    .map(값 => 값 / 255)
    .map(값 => 값 <= 0.04045 ? 값 / 12.92 : ((값 + 0.055) / 1.055) ** 2.4)
    .reduce((합계, 값, 번호) => 합계 + 값 * [0.2126, 0.7152, 0.0722][번호], 0);
  const 대비 = (앞: readonly number[], 뒤: readonly number[]) => {
    const [밝음, 어두움] = [휘도(앞), 휘도(뒤)].sort((a, b) => b - a);
    return (밝음 + 0.05) / (어두움 + 0.05);
  };

  for (const [테마, 팔레트] of Object.entries(필사팔레트들)) {
    for (const 색 of ['바탕글', '먹색', '안내'] as const) {
      expect(대비(팔레트[색], 팔레트.종이), `${테마} ${색}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

it('테마를 바꿔도 이미 입력한 자소와 진행 위치가 유지된다', () => {
  const 지문 = new 지문틀();
  지문.글쓰기('가');
  지문.쓰기(지문.위치, 끝글자);
  const 본문 = new 따라그리기틀(지문);
  본문.입력('KeyR', false);
  const 진행률 = 본문.진행률;

  본문.팔레트설정(필사팔레트들.밤);
  const 색자 = 본문.글자스트림().next().value;

  expect(본문.진행률).toBe(진행률);
  expect(색자.색[0]).toBe(필사팔레트들.밤.먹색);
  expect(색자.색[1]).toBe(필사팔레트들.밤.바탕글);
  expect(색자.배경색).toBe(필사팔레트들.밤.커서);
});

it('큰 글씨에서는 줄을 짧게 감고 깜빡임을 끌 수 있다', () => {
  const 지문 = new 지문틀();
  지문.글쓰기('가'.repeat(35));
  지문.쓰기(지문.위치, 끝글자);
  const 본문 = new 따라그리기틀(지문, 필사팔레트들.밤);
  const 칠한색: string[] = [];
  let 현재색 = '';
  const 타이머시작 = vi.fn();
  const ctx = {
    canvas: { width: 1286, height: 500 },
    set fillStyle(value: string) { 현재색 = value; },
    fillRect: () => { 칠한색.push(현재색); },
  } as unknown as CanvasRenderingContext2D;
  vi.stubGlobal('window', { setInterval: 타이머시작, matchMedia: () => ({ matches: false }) });
  try {
    const 그림판 = new 그림판틀(ctx, 본문, {
      팔레트: 필사팔레트들.밤, 한줄칸수: 68, 커서깜빡임: false,
    });
    const 글자그리기 = vi.spyOn(그림판, '글자그리기').mockImplementation(() => undefined);
    그림판.그리기();

    expect(ctx.canvas.width).toBe(1094);
    expect(글자그리기.mock.calls[34][0].행).toBe(1);
    expect(칠한색[0]).toBe('rgba(34, 44, 49, 1)');
    expect(타이머시작).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
