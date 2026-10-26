import { 공개주제들, 전체주제들, 표시주제들, 주제표시이름 } from '@/practice-pinned-topics';
import { 테마별지문들 } from '@/practice-passages';

it('요청한 열 가지 주제만 순서대로 표시하고 지문 분류는 보존한다', () => {
  expect(표시주제들('https://dailytyping.com').map(주제표시이름)).toEqual([
    '시작하기', '즐겨찾기', '산문', '자기계발', '스포츠',
    '요리', '감정', '동물', '식물', '우주',
  ]);
  expect(공개주제들.every((주제) => 주제 === '즐겨찾기' || 주제 in 테마별지문들)).toBe(true);
  expect(테마별지문들['요리레시피']).not.toHaveLength(0);
  expect(테마별지문들['감정 읽기']).not.toHaveLength(0);
  expect(테마별지문들['명상']).not.toHaveLength(0);
  expect(공개주제들).not.toContain('명상');
  expect(표시주제들('https://dev.dailytyping.com')).toEqual(전체주제들);
  expect(표시주제들('http://127.0.0.1')).toEqual(전체주제들);
  expect(전체주제들).toContain('명상');
});
