import { readFileSync } from 'node:fs';
import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 기본필사설정, 단계별안티앨리어싱강도, 필사설정읽기, 필사설정저장,
  필사테마순서, 글자크기별글꼴, 필사팔레트들 } from '@/practice-settings';

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
  for (const 테마 of 필사테마순서) {
    필사설정저장({ ...설정, 테마 }, storage);
    expect(필사설정읽기(storage).테마).toBe(테마);
  }
  값들.set([...값들.keys()][0], JSON.stringify({ 테마: '밤', 글자크기: '크게', 커서깜빡임: false }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(3);

  const 키 = [...값들.keys()][0];
  값들.set(키, JSON.stringify({ ...설정, 테마: '호박색 모니터', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('커피');
  값들.set(키, JSON.stringify({ ...설정, 테마: '불멍', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('모닥불');
  값들.set(키, JSON.stringify({ ...설정, 테마: '수면과 반사', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('수면과 파문');
  값들.set(키, JSON.stringify({ ...설정, 테마: '메밀밭', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('숲');
  값들.set(키, JSON.stringify({ ...설정, 테마: '하늘', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('구름');
  값들.set(키, JSON.stringify({ ...설정, 테마: '흐르는 구름', 설정버전: 2 }));
  expect(필사설정읽기(storage).테마).toBe('구름');
  for (const 테마 of ['바람결', '달빛 창가', '파도', '찻김', '나뭇그늘', '폭포수', '무지개', '반딧불', '수묵 안개', '종이등', '눈발', '모래결', '오후', '산호', '정원', '모과', '자두', '호수', '벚꽃', '빙하', '항구', '낙관', '바다', '우주']) {
    값들.set(키, JSON.stringify({ ...설정, 테마, 설정버전: 2 }));
    expect(필사설정읽기(storage).테마).toBe('한지');
    expect(필사설정읽기(storage).글자크기).toBe('크게');
  }
  값들.set(키, '{');
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
  값들.set(키, JSON.stringify({ 안티앨리어싱단계: 6 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(3);
  값들.set(키, JSON.stringify({ 안티앨리어싱: 300 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(4);
  값들.set(키, JSON.stringify({ 안티앨리어싱단계: 5 }));
  expect(필사설정읽기(storage).안티앨리어싱단계).toBe(4);
  값들.set(키, JSON.stringify({ ...설정, 글꼴확대방식: '기존', 설정버전: 2 }));
  expect(필사설정읽기(storage)).toEqual(설정);
  필사설정저장(필사설정읽기(storage), storage);
  expect(JSON.parse(값들.get(키)!)).not.toHaveProperty('글꼴확대방식');
  값들.set(키, JSON.stringify({ 테마: '알 수 없음', 글자크기: '매우 크게', 커서깜빡임: 1 }));
  expect(필사설정읽기(storage)).toEqual(기본필사설정);
});

it('지문 글자 크기에 맞춰 글꼴 해상도를 자동 선택한다', () => {
  expect(글자크기별글꼴).toEqual({
    작게: { 확대방식: '윤곽', 해상도배율: 1 },
    보통: { 확대방식: '윤곽48', 해상도배율: 1.5 },
    크게: { 확대방식: '윤곽64', 해상도배율: 2 },
  });
});

it('열아홉 테마가 선택 순서와 팔레트에 빠짐없이 반영된다', () => {
  expect(필사테마순서).toHaveLength(19);
  expect(필사테마순서.slice(1, 6)).toEqual(['새벽', '밤', '숲', '청보리', '폭포']);
  expect(필사테마순서.slice(6, 9)).toEqual(['라벤더', '커피', '촛불']);
  expect(필사테마순서.slice(-7)).toEqual(['수면과 파문', '빗방울', '구름', '모닥불', '인센스', '오로라', '별똥별']);
  expect(Object.keys(필사팔레트들)).toEqual([...필사테마순서]);
});

it('모든 필사 테마의 첫 화면 스타일이 정의되어 있다', () => {
  const 첫화면 = readFileSync(new URL('../../src/views/PracticeEntry.vue', import.meta.url), 'utf8');
  const 테마들 = [...첫화면.matchAll(/\.첫화면\[data-theme='([^']+)'\] \{/g)]
    .map(([, 테마]) => 테마);
  expect(테마들).toEqual([...필사테마순서]);
});

it('슬라이더 다섯 눈금은 이전 강도의 절반이고 최댓값은 150이다', () => {
  expect(단계별안티앨리어싱강도).toEqual([0, 25, 50, 100, 150]);
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
