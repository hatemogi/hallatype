import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 연습지문들 } from '@/practice-passages';
import { 본문버전, 시도목록, 시도시작, 시도완료, 시도중단, 입력묶음,
  진행작업읽기, 진행작업저장, 작업합치기, 지문입력상태, 지문최고정타율, 정타율,
  type 저장소 } from '@/practice-progress';

function 메모리저장소(): 저장소 {
  const 값들 = new Map<string, string>();
  return {
    get length() { return 값들.size; },
    key: (번호) => [...값들.keys()][번호] ?? null,
    getItem: (키) => 값들.get(키) ?? null,
    setItem: (키, 값) => { 값들.set(키, 값); },
  };
}

it('지문 ID는 영문자 12자리로 고정한다', () => {
  expect(new Set(연습지문들.map((지문) => 지문.id)).size).toBe(연습지문들.length);
  expect(연습지문들.every((지문) => /^[A-Za-z]{12}$/.test(지문.id))).toBe(true);
  const 본문 = 연습지문들[0].본문;
  expect(본문버전(본문)).toBe(본문버전(본문));
  expect(본문버전(본문)).not.toBe(본문버전(본문 + '가'));
});

it('불변 입력 작업을 저장하고 다시 읽어 진행 상태를 재생한다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 본문버전('가나'));
  const 첫입력 = 입력묶음(시작.attemptId, 0, [
    { code: 'KeyT', shift: false }, { code: 'KeyR', shift: false }, { code: 'KeyK', shift: false },
  ], 1200);
  const 둘째입력 = 입력묶음(시작.attemptId, 1, [
    { code: 'KeyS', shift: false }, { code: 'KeyK', shift: false },
  ], 2300);
  for (const 작업 of [시작, 첫입력, 둘째입력]) {
    expect(작업.id).toMatch(/^[A-Za-z]{12}$/);
    expect(진행작업저장(작업, 저장소)).toBe(true);
  }
  expect(시작.attemptId).toMatch(/^[A-Za-z]{12}$/);
  const [복원] = 시도목록(진행작업읽기(저장소));
  expect(복원.다음순서).toBe(2);
  expect(복원.걸린밀리초).toBe(2300);
  const 지문 = new 지문틀();
  지문.글쓰기('가나');
  지문.쓰기(지문.위치, 끝글자);
  const 본문 = new 따라그리기틀(지문);
  for (const 키 of 복원.입력들) { 본문.입력(키.code, 키.shift); }
  expect(본문.끝).toBe(true);
  expect(본문.입력타수).toBe(5);
  expect(본문.유효타수).toBe(3);
  expect(본문.진행률).toBe(100);
});

it('합집합 병합은 순서와 재전송에 무관하고 시도별 완료 및 중단을 보존한다', () => {
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 입력 = 입력묶음(시작.attemptId, 0, [{ code: 'KeyR', shift: false }], 100);
  const 완료 = 시도완료(시작.attemptId, 100, 1, 1);
  const 다시시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 중단 = 시도중단(다시시작.attemptId);
  const 병합 = 작업합치기([완료, 시작], [입력, 완료, 다시시작, 중단]);
  expect(병합).toHaveLength(5);
  expect(작업합치기(병합, 병합)).toHaveLength(5);
  const 시도들 = 시도목록(병합);
  expect(시도들.find((시도) => 시도.시작.attemptId === 시작.attemptId)?.완료).toEqual(완료);
  expect(시도들.find((시도) => 시도.시작.attemptId === 다시시작.attemptId)?.중단됨).toBe(true);
});

it('두 탭이 같은 지점에서 이어 쓰면 별도 시도로 갈라져 모두 남는다', () => {
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 공통입력 = 입력묶음(시작.attemptId, 0, [{ code: 'KeyR', shift: false }], 100);
  const 이어쓰기 = { attemptId: 시작.attemptId, inputCount: 1, elapsedMs: 100 };
  const 첫탭 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1', 이어쓰기);
  const 둘째탭 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1', 이어쓰기);
  const 첫입력 = 입력묶음(첫탭.attemptId, 0, [{ code: 'KeyK', shift: false }], 200);
  const 둘째입력 = 입력묶음(둘째탭.attemptId, 0, [{ code: 'KeyS', shift: false }], 300);
  const 시도들 = 시도목록([둘째입력, 첫입력, 둘째탭, 공통입력, 시작, 첫탭]);
  expect(시도들.find((시도) => 시도.시작.attemptId === 첫탭.attemptId)?.입력들.map((키) => 키.code))
    .toEqual(['KeyR', 'KeyK']);
  expect(시도들.find((시도) => 시도.시작.attemptId === 둘째탭.attemptId)?.입력들.map((키) => 키.code))
    .toEqual(['KeyR', 'KeyS']);
  expect(시도들.filter((시도) => 시도.복원가능)).toHaveLength(3);
});

it('같은 지문의 입력은 날짜가 바뀌어도 이어 쓸 수 있다', () => {
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 입력 = 입력묶음(시작.attemptId, 0, [{ code: 'KeyR', shift: false }], 100);
  const 다음날 = 시도시작(연습지문들[0].id, '2026-11-06', 'v1',
    { attemptId: 시작.attemptId, inputCount: 1, elapsedMs: 100 });
  const 시도들 = 시도목록([시작, 입력, 다음날]);
  expect(시도들.find((시도) => 시도.시작.attemptId === 다음날.attemptId)?.복원가능).toBe(true);
  expect(시도들.find((시도) => 시도.시작.attemptId === 다음날.attemptId)?.입력들)
    .toEqual([{ code: 'KeyR', shift: false }]);
  expect(시작.day).not.toBe(다음날.day);
});

it('지문별 완료 표시는 날짜를 넘어 유지하고 본문이 바뀌면 초기화한다', () => {
  const 지문ID = 연습지문들[0].id;
  const 시작 = 시도시작(지문ID, '2026-10-23', 'v1');
  const 입력 = 입력묶음(시작.attemptId, 0, [{ code: 'KeyR', shift: false }], 100);
  expect(지문입력상태(시도목록([시작, 입력]), 지문ID, 'v1')).toBe('입력 중');
  const 완료 = 시도완료(시작.attemptId, 200, 2, 1);
  const 다음날 = 시도시작(지문ID, '2026-10-24', 'v1');
  expect(지문입력상태(시도목록([시작, 입력, 완료, 다음날]), 지문ID, 'v1')).toBe('완료');
  expect(지문입력상태(시도목록([시작, 입력, 완료]), 지문ID, 'v2')).toBe('미완료');
  expect(정타율(2, 3)).toBe('66.67');
  expect(정타율(0, 0)).toBe('0.00');
});

it('지문별 최고 정타율은 완료한 시도에서만 구하고 이번 시도를 제외해 종전 기록을 비교한다', () => {
  const 지문ID = 연습지문들[0].id;
  const 다른지문ID = 연습지문들[1].id;
  const 시작들 = [
    시도시작(지문ID, '2026-10-23', 'v1'),
    시도시작(지문ID, '2026-10-24', 'v1'),
    시도시작(지문ID, '2026-10-25', 'v1'),
    시도시작(지문ID, '2026-10-26', 'v2'),
    시도시작(다른지문ID, '2026-10-26', 'v1'),
    시도시작(지문ID, '2026-10-27', 'v1'),
  ];
  const 완료들 = [
    시도완료(시작들[0].attemptId, 1000, 20, 18),
    시도완료(시작들[1].attemptId, 1000, 20, 19),
    시도완료(시작들[2].attemptId, 1000, 20, 17),
    시도완료(시작들[3].attemptId, 1000, 10, 10),
    시도완료(시작들[4].attemptId, 1000, 10, 10),
  ];
  const 시도들 = 시도목록([...시작들, ...완료들]);

  expect(지문최고정타율(시도들, 지문ID, 'v1')).toBe(95);
  expect(지문최고정타율(시도들, 지문ID, 'v1', 시작들[1].attemptId)).toBe(90);
  expect(지문최고정타율(시도들, 지문ID, 'v2')).toBe(100);
  expect(지문최고정타율(시도들, 다른지문ID, 'v1')).toBe(100);
  expect(지문최고정타율(시도들, 다른지문ID, 'v2')).toBeNull();
});

it('같은 날 다른 지문의 입력은 별도로 보존한다', () => {
  const 첫글 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 첫입력 = 입력묶음(첫글.attemptId, 0, [{ code: 'KeyR', shift: false }], 100);
  const 다른글 = 시도시작(연습지문들[1].id, '2026-10-23', 'v1');
  const 다른입력 = 입력묶음(다른글.attemptId, 0, [{ code: 'KeyK', shift: false }], 200);
  const 시도들 = 시도목록([첫글, 첫입력, 다른글, 다른입력]);
  expect(시도들.find((시도) => 시도.시작.passageId === 연습지문들[0].id)?.입력들)
    .toEqual([{ code: 'KeyR', shift: false }]);
  expect(시도들.find((시도) => 시도.시작.passageId === 연습지문들[1].id)?.입력들)
    .toEqual([{ code: 'KeyK', shift: false }]);
});

it('이전 분할 지문의 v1 기록은 새 날짜별 기록으로 읽지 않는다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  저장소.setItem(`hallatype:progress:v1:op:${시작.id}`,
    JSON.stringify({ ...시작, schema: 1, part: 1 }));
  expect(진행작업읽기(저장소)).toEqual([]);
});

it('12자 영문자가 아닌 ID의 저장 기록은 읽거나 병합하지 않는다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 이전 = { ...시작, passageId: 'oUgKjp844MMLvLGb' };
  저장소.setItem(`hallatype:progress:v2:op:${이전.id}`, JSON.stringify(이전));
  expect(진행작업읽기(저장소)).toEqual([]);
  expect(진행작업저장(이전, 저장소)).toBe(false);
  expect(작업합치기([], [이전])).toEqual([]);
  expect(시도목록([이전])).toEqual([]);
  expect(() => 시도시작('oUgKjp844MMLvLGb', '2026-10-23', 'v1')).toThrow();
  expect(시도완료(시작.attemptId, 200, 2, 2).id).toMatch(/^[A-Za-z]{12}$/);
  expect(시도중단(시작.attemptId).id).toMatch(/^[A-Za-z]{12}$/);
});

it('손상된 저장 항목과 빠진 입력 순서를 건너뛰고 정상 기록을 유지한다', () => {
  const 저장소 = 메모리저장소();
  저장소.setItem('hallatype:progress:v2:op:broken', '{');
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-23', 'v1');
  const 뒤입력 = 입력묶음(시작.attemptId, 1, [{ code: 'KeyK', shift: false }], 200);
  진행작업저장(시작, 저장소);
  진행작업저장(뒤입력, 저장소);
  const [복원] = 시도목록(진행작업읽기(저장소));
  expect(복원.입력들).toEqual([]);
  expect(복원.다음순서).toBe(0);
  expect(복원.복원가능).toBe(false);
});
