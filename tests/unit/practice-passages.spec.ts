import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 날짜키, 연습지문들, 테마별지문들 } from '@/practice-passages';

it('시작하기 맛보기와 기존 테마에 입력 가능한 지문을 둔다', () => {
  const 전체 = Object.values(테마별지문들).flat();
  expect(Object.keys(테마별지문들)[0]).toBe('시작하기');
  expect(테마별지문들.시작하기).toHaveLength(5);
  expect(테마별지문들.산문).toBe(연습지문들);
  expect(테마별지문들.산문).toHaveLength(14);
  expect(테마별지문들.자기계발).toHaveLength(14);
  expect(테마별지문들.명상).toHaveLength(14);
  expect(테마별지문들.자기확언).toHaveLength(14);
  expect(테마별지문들['스토아 철학']).toHaveLength(14);
  expect(테마별지문들['감정 읽기']).toHaveLength(14);
  expect(테마별지문들.생활체육).toHaveLength(14);
  expect(테마별지문들.조선시대).toHaveLength(14);
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

it('날짜를 현지 날짜 문자열로 표시한다', () => {
  expect(날짜키(new Date(2026, 9, 23, 12))).toBe('2026-10-23');
});
