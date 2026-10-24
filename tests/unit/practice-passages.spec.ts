import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 날짜키, 다음지문찾기, 연습지문들, 지문선택읽기, 지문선택저장,
  테마별지문들 } from '@/practice-passages';

it('시작하기 맛보기와 기존 테마에 입력 가능한 지문을 둔다', () => {
  const 전체 = Object.values(테마별지문들).flat();
  expect(Object.keys(테마별지문들)[0]).toBe('시작하기');
  expect(테마별지문들.시작하기).toHaveLength(5);
  expect(테마별지문들.산문).toBe(연습지문들);
  expect(테마별지문들.산문).toHaveLength(14);
  expect(테마별지문들.자기계발).toHaveLength(14);
  expect(테마별지문들.명상).toHaveLength(14);
  expect(테마별지문들.자기확언).toHaveLength(14);
  expect(테마별지문들.생활교양).toHaveLength(14);
  expect(테마별지문들.요리레시피).toHaveLength(14);
  expect(테마별지문들['메밀꽃 필 무렵']).toHaveLength(27);
  expect(테마별지문들.봄봄).toHaveLength(37);
  expect(new Set(전체.map((지문) => 지문.id)).size).toBe(전체.length);
  for (const 선택 of 전체) {
    expect(선택.id).toMatch(/^[A-Za-z]{12}$/);
    if (테마별지문들.시작하기.includes(선택)) {
      expect(선택.본문.length).toBeGreaterThanOrEqual(90);
      expect(선택.본문.length).toBeLessThanOrEqual(125);
    } else {
      expect(선택.본문.length).toBeGreaterThanOrEqual(260);
      expect(선택.본문.length).toBeLessThanOrEqual(330);
    }
    expect(선택.본문).not.toMatch(/[.!?][가-힣]/);
    expect(선택.본문).toMatch(/^[\uAC00-\uD7A3\x20-\x7E]+$/);
    const 지문 = new 지문틀();
    지문.글쓰기(선택.본문);
    지문.쓰기(지문.위치, 끝글자);
    expect(new 따라그리기틀(지문).기대타수).toBeGreaterThan(100);
  }
  expect(테마별지문들['메밀꽃 필 무렵'][0].본문).toMatch(/^여름장이란/);
  expect(테마별지문들['메밀꽃 필 무렵'].at(-1)?.본문).toMatch(/달이 어지간히 기울어졌다\.$/);
  expect(테마별지문들.봄봄[0].본문).toMatch(/^"장인님!/);
  expect(테마별지문들.봄봄.at(-1)?.본문).toMatch(/할아버지 소리가 나오도록 해\?"$/);
  expect(테마별지문들['메밀꽃 필 무렵'][0].원문URL).toContain('ko.wikisource.org');
  expect(테마별지문들.봄봄[0].저자).toBe('김유정');
});

it('모든 테마에서 다음 지문으로 이어 가고 마지막 지문 뒤에는 첫 지문으로 돌아간다', () => {
  for (const 테마 of Object.keys(테마별지문들) as Array<keyof typeof 테마별지문들>) {
    const 지문들 = 테마별지문들[테마];
    expect(다음지문찾기(테마, 지문들[0].id)).toBe(지문들[1]);
    expect(다음지문찾기(테마, 지문들.at(-1)!.id)).toBe(지문들[0]);
  }
});

it('고른 지문을 날짜에 관계없이 보존하고 기존 저장 형식도 읽는다', () => {
  const 값들 = new Map<string, string>();
  const 저장소 = { getItem: (키: string) => 값들.get(키) ?? null,
    setItem: (키: string, 값: string) => { 값들.set(키, 값); } };
  expect(날짜키(new Date(2026, 9, 23, 12))).toBe('2026-10-23');
  expect(지문선택읽기(저장소)).toEqual({ 테마: '시작하기', 지문: 테마별지문들.시작하기[0] });
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
  const 봄봄지문 = 테마별지문들.봄봄[26];
  지문선택저장('봄봄', 봄봄지문.id, 저장소);
  expect(지문선택읽기(저장소)).toEqual({ 테마: '봄봄', 지문: 봄봄지문 });
});
