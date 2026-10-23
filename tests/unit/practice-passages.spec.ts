import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 연습지문들, 필사편들 } from '@/practice-passages';

it('원문을 문단 경계에서 두 편으로 나누어 짧게 필사할 수 있다', () => {
  expect(연습지문들).toHaveLength(9);
  expect(new Set(연습지문들.map((지문) => 지문.제목)).size).toBe(연습지문들.length);
  for (const 선택 of 연습지문들) {
    const 편들 = 필사편들(선택);
    expect(편들).toHaveLength(2);
    expect(편들.join('\n')).toBe(선택.본문);
    for (const 편 of 편들) {
      expect(편.length).toBeGreaterThanOrEqual(300);
      expect(편.length).toBeLessThanOrEqual(500);
      expect(편).toMatch(선택.언어 === 'en' ? /^[\x20-\x7E\n]+$/ : /^[\uAC00-\uD7A3\x20-\x7E\n]+$/);
      const 지문 = new 지문틀();
      지문.글쓰기(편);
      지문.쓰기(지문.위치, 끝글자);
      const 기대타수 = new 따라그리기틀(지문).기대타수;
      expect(기대타수).toBeGreaterThanOrEqual(선택.언어 === 'en' ? 300 : 500);
      expect(기대타수).toBeLessThanOrEqual(1100);
    }
  }
});

it('문학 발췌 지문에는 원문 출처를 표시한다', () => {
  const 발췌 = 연습지문들.filter((지문) => !지문.출처.startsWith('창작 지문'));
  expect(발췌).toHaveLength(4);
  expect(발췌.every((지문) => 지문.원문?.includes('ko.wikisource.org/wiki/'))).toBe(true);
});

it('영어 창작 지문 세 편을 제공한다', () => {
  const 영어지문들 = 연습지문들.filter((지문) => 지문.언어 === 'en');
  expect(영어지문들).toHaveLength(3);
  expect(영어지문들.every((지문) => 지문.출처 === '창작 지문 · 영어')).toBe(true);
});
