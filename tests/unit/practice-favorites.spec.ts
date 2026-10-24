import { 테마별지문들 } from '@/practice-passages';
import { 즐겨찾기바꾸기, 즐겨찾기읽기, 즐겨찾기저장, 즐겨찾기저장키,
  즐겨찾기지문들, 즐겨찾기정리, 지문원래테마 } from '@/practice-favorites';

function 메모리저장소() {
  const 항목들 = new Map<string, string>();
  return {
    getItem: (키: string) => 항목들.get(키) ?? null,
    setItem: (키: string, 값: string) => { 항목들.set(키, 값); },
  };
}

it('별을 누른 지문을 순서대로 저장하고 다시 읽으며 해제한다', () => {
  const 저장소 = 메모리저장소();
  const 첫글 = 테마별지문들.산문[0];
  const 둘째글 = 테마별지문들.식물[2];
  let 목록 = 즐겨찾기바꾸기([], 첫글.id);
  목록 = 즐겨찾기바꾸기(목록, 둘째글.id);
  expect(즐겨찾기저장(목록, 저장소)).toBe(true);
  expect(JSON.parse(저장소.getItem(즐겨찾기저장키)!)).toEqual([첫글.id, 둘째글.id]);
  expect(즐겨찾기읽기(저장소)).toEqual(목록);
  expect(즐겨찾기지문들(목록)).toEqual([첫글, 둘째글]);
  expect(지문원래테마(둘째글.id)).toBe('식물');
  expect(즐겨찾기바꾸기(목록, 첫글.id)).toEqual([둘째글.id]);
});

it('중복과 없는 지문을 제외하고 손상된 저장값을 안전하게 읽는다', () => {
  const 저장소 = 메모리저장소();
  const 지문ID = 테마별지문들.시작하기[0].id;
  expect(즐겨찾기정리([지문ID, 지문ID, 'missing', 42])).toEqual([지문ID]);
  expect(즐겨찾기바꾸기([지문ID], 'missing')).toEqual([지문ID]);
  저장소.setItem(즐겨찾기저장키, '{');
  expect(즐겨찾기읽기(저장소)).toEqual([]);
  저장소.setItem(즐겨찾기저장키, JSON.stringify([지문ID, 'missing', 지문ID]));
  expect(즐겨찾기읽기(저장소)).toEqual([지문ID]);
});
