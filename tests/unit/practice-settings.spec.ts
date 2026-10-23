import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 기본필사설정, 필사설정읽기, 필사설정저장, 필사팔레트들 } from '@/practice-settings';

it('필사 설정을 저장하고 잘못된 저장값은 기본값으로 복구한다', () => {
  const 값들 = new Map<string, string>();
  const storage = {
    getItem: (key: string) => 값들.get(key) ?? null,
    setItem: (key: string, value: string) => { 값들.set(key, value); },
  };
  expect(필사설정읽기(storage)).toEqual(기본필사설정);

  const 설정 = { 테마: '밤' as const, 글자크기: '크게' as const, 커서깜빡임: false };
  필사설정저장(설정, storage);
  expect(필사설정읽기(storage)).toEqual(설정);

  const 키 = [...값들.keys()][0];
  값들.set(키, '{');
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
  값들.set(키, JSON.stringify({ 테마: '알 수 없음', 글자크기: '매우 크게', 커서깜빡임: 1 }));
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
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
