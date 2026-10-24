import { 기본고정주제들, 고정주제바꾸기, 고정주제읽기, 고정주제저장,
  고정주제저장키, 고정주제정리, 고정주제한도, 선택가능주제들, 전체주제들,
  주제묶음들, 항상표시주제들, 이전고정주제저장키 } from '@/practice-pinned-topics';

function 메모리저장소() {
  const 항목들 = new Map<string, string>();
  return {
    getItem: (키: string) => 항목들.get(키) ?? null,
    setItem: (키: string, 값: string) => { 항목들.set(키, 값); },
  };
}

it('모든 주제를 선택창의 묶음에서 한 번씩 찾을 수 있다', () => {
  const 묶은주제들 = 주제묶음들.flatMap((묶음) => 묶음.주제들);
  expect(new Set(묶은주제들)).toEqual(new Set(선택가능주제들));
  expect(묶은주제들).toHaveLength(선택가능주제들.length);
  expect(전체주제들).toEqual([...항상표시주제들, ...선택가능주제들]);
  expect(기본고정주제들).toHaveLength(고정주제한도);
  expect([...항상표시주제들, ...기본고정주제들]).toHaveLength(10);
});

it('항상 표시 주제를 제외한 여덟 개까지 저장하고 다시 읽는다', () => {
  const 저장소 = 메모리저장소();
  expect(고정주제읽기(저장소)).toEqual(기본고정주제들);
  const 선택 = ['스포츠'] as const;
  expect(고정주제저장(선택, 저장소)).toBe(true);
  expect(JSON.parse(저장소.getItem(고정주제저장키)!)).toEqual(선택);
  expect(고정주제읽기(저장소)).toEqual(선택);
  expect(고정주제바꾸기(선택, '우주')).toEqual([...선택, '우주']);
  expect(고정주제바꾸기(선택, '스포츠')).toEqual([]);
  expect(고정주제바꾸기(선택, '즐겨찾기')).toEqual(선택);
  expect(고정주제바꾸기(기본고정주제들, '우주')).toEqual(기본고정주제들);
  expect(고정주제저장([], 저장소)).toBe(true);
  expect(고정주제읽기(저장소)).toEqual([]);
});

it('기존 저장값의 시작하기와 즐겨찾기를 제외하고 선택한 순서를 보존한다', () => {
  const 저장소 = 메모리저장소();
  expect(고정주제정리(['스포츠', '스포츠', '없는 주제', ...전체주제들]))
    .toEqual(['스포츠', ...선택가능주제들.filter((주제) => 주제 !== '스포츠').slice(0, 7)]);
  저장소.setItem(이전고정주제저장키, JSON.stringify(['시작하기', '즐겨찾기', '산문', '스포츠']));
  expect(고정주제읽기(저장소)).toEqual([
    '산문', '스포츠', ...기본고정주제들.filter((주제) => !['산문', '스포츠'].includes(주제)).slice(0, 6),
  ]);
  저장소.setItem(고정주제저장키, '{');
  expect(고정주제읽기(저장소)).toEqual(기본고정주제들);
  저장소.setItem(고정주제저장키, JSON.stringify(['시작하기', '스포츠', '없는 주제', '스포츠']));
  expect(고정주제읽기(저장소)).toEqual(['스포츠']);
});
