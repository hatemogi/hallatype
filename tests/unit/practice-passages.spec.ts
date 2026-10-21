import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 연습지문들 } from '@/practice-passages';

it('세 지문을 모두 따라그리기 키 순서로 만들 수 있다', () => {
  expect(연습지문들).toHaveLength(3);
  expect(new Set(연습지문들.map((지문) => 지문.제목)).size).toBe(3);
  for (const 선택 of 연습지문들) {
    const 지문 = new 지문틀();
    지문.글쓰기(선택.본문);
    지문.쓰기(지문.위치, 끝글자);
    expect(new 따라그리기틀(지문).기대타수).toBeGreaterThan(100);
  }
});
