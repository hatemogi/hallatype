import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 날짜키, 연습지문들, 지문선택읽기, 지문선택저장,
  테마별지문들 } from '@/practice-passages';

it('여섯 테마에 각각 14개의 입력 가능한 300자 지문을 둔다', () => {
  const 전체 = Object.values(테마별지문들).flat();
  expect(테마별지문들.산문).toBe(연습지문들);
  expect(테마별지문들.산문).toHaveLength(14);
  expect(테마별지문들.자기계발).toHaveLength(14);
  expect(테마별지문들.명상).toHaveLength(14);
  expect(테마별지문들.자기확언).toHaveLength(14);
  expect(테마별지문들.생활교양).toHaveLength(14);
  expect(테마별지문들.요리레시피).toHaveLength(14);
  expect(new Set(전체.map((지문) => 지문.id)).size).toBe(전체.length);
  for (const 선택 of 전체) {
    expect(선택.id).toMatch(/^[A-Za-z]{12}$/);
    expect(선택.본문.length).toBeGreaterThanOrEqual(280);
    expect(선택.본문.length).toBeLessThanOrEqual(330);
    expect(선택.본문).not.toMatch(/[.!?][가-힣]/);
    expect(선택.본문).toMatch(/^[\uAC00-\uD7A3\x20-\x7E]+$/);
    const 지문 = new 지문틀();
    지문.글쓰기(선택.본문);
    지문.쓰기(지문.위치, 끝글자);
    expect(new 따라그리기틀(지문).기대타수).toBeGreaterThan(100);
  }
});

it('고른 지문을 날짜에 관계없이 보존하고 기존 저장 형식도 읽는다', () => {
  const 값들 = new Map<string, string>();
  const 저장소 = { getItem: (키: string) => 값들.get(키) ?? null,
    setItem: (키: string, 값: string) => { 값들.set(키, 값); } };
  expect(날짜키(new Date(2026, 9, 23, 12))).toBe('2026-10-23');
  expect(지문선택읽기(저장소)).toEqual({ 테마: '산문', 지문: 연습지문들[0] });
  const 다른지문 = 테마별지문들.자기계발[5];
  저장소.setItem('hallatype:passage-selection:v1', JSON.stringify({
    날짜: '2026-10-23', 테마: '자기계발', 지문ID: 다른지문.id,
  }));
  expect(지문선택읽기(저장소)).toEqual({ 테마: '자기계발', 지문: 다른지문 });
  지문선택저장('자기계발', 테마별지문들.산문[3].id, 저장소);
  expect(지문선택읽기(저장소).지문).toBe(테마별지문들.자기계발[0]);
  const 명상지문 = 테마별지문들.명상[4];
  지문선택저장('명상', 명상지문.id, 저장소);
  expect(지문선택읽기(저장소)).toEqual({ 테마: '명상', 지문: 명상지문 });
  const 확언지문 = 테마별지문들.자기확언[7];
  지문선택저장('자기확언', 확언지문.id, 저장소);
  expect(지문선택읽기(저장소)).toEqual({ 테마: '자기확언', 지문: 확언지문 });
  const 교양지문 = 테마별지문들.생활교양[9];
  지문선택저장('생활교양', 교양지문.id, 저장소);
  expect(지문선택읽기(저장소)).toEqual({ 테마: '생활교양', 지문: 교양지문 });
  const 레시피지문 = 테마별지문들.요리레시피[3];
  지문선택저장('요리레시피', 레시피지문.id, 저장소);
  expect(지문선택읽기(저장소)).toEqual({ 테마: '요리레시피', 지문: 레시피지문 });
});
