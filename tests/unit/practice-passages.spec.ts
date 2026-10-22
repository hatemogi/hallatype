import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 연습지문들 } from '@/practice-passages';

it('모든 필사 지문을 입력 가능한 키 순서로 만들 수 있다', () => {
  expect(연습지문들).toHaveLength(6);
  expect(new Set(연습지문들.map((지문) => 지문.제목)).size).toBe(연습지문들.length);
  for (const 선택 of 연습지문들) {
    expect(선택.본문).toMatch(/^[\uAC00-\uD7A3\x20-\x7E\n]+$/);
    const 지문 = new 지문틀();
    지문.글쓰기(선택.본문);
    지문.쓰기(지문.위치, 끝글자);
    expect(new 따라그리기틀(지문).기대타수).toBeGreaterThan(100);
  }
});

it('메밀꽃 발췌 지문에는 원문 출처를 표시한다', () => {
  const 발췌 = 연습지문들.filter((지문) => 지문.제목.startsWith('메밀꽃 ·'));
  expect(발췌).toHaveLength(3);
  expect(발췌.every((지문) => 지문.원문?.includes('ko.wikisource.org/wiki/'))).toBe(true);
});
