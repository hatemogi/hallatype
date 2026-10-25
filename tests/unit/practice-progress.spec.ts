import { 끝글자 } from '@/글자';
import { 지문틀 } from '@/본문';
import { 따라그리기틀 } from '@/따라그리기';
import { 연습지문들 } from '@/practice-passages';
import { 본문버전, 시도목록, 시도시작, 시도완료, 시도중단, 입력묶음,
  진행기록키인가, 진행작업읽기, 진행작업저장, 작업합치기,
  지문입력상태, 지문최근시도, 지문재개시도, 지문최고정타율, 지문도장등급,
  완전정타인가, 정타도장, 정타율, 정타율표시,
  이번이최고정타율인가,
  type 저장소 } from '@/practice-progress';

function 메모리저장소(최대길이 = Infinity): 저장소 {
  const 값들 = new Map<string, string>();
  return {
    get length() { return 값들.size; },
    key: (번호) => [...값들.keys()][번호] ?? null,
    getItem: (키) => 값들.get(키) ?? null,
    setItem: (키, 값) => {
      const 현재크기 = [...값들].reduce((합, [이름, 내용]) => 합 + 이름.length + 내용.length, 0);
      const 이전 = 값들.get(키);
      const 새크기 = 현재크기 - (이전 === undefined ? 0 : 키.length + 이전.length) + 키.length + 값.length;
      if (새크기 > 최대길이) { throw new Error('QuotaExceededError'); }
      값들.set(키, 값);
    },
    removeItem: (키) => { 값들.delete(키); },
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

it('키 입력과 시각을 짧게 저장하고 모든 키 조합을 그대로 복원한다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 키들 = [
    { code: 'KeyA', shift: false }, { code: 'KeyB', shift: false },
    { code: 'KeyC', shift: true }, { code: 'Digit7', shift: false },
    ...['Space', 'Enter', 'Backspace', 'Backquote', 'Minus', 'Equal', 'BracketLeft',
      'BracketRight', 'Backslash', 'Semicolon', 'Quote', 'Comma', 'Period', 'Slash']
      .map((code) => ({ code, shift: false })),
    { code: 'Slash', shift: true }, { code: 'Unmapped', shift: true },
  ];
  const 입력 = 입력묶음(시작.attemptId, 0, 키들, 1234);
  const 완료 = 시도완료(시작.attemptId, 1234, 키들.length, 키들.length);
  const 중단 = 시도중단(시작.attemptId);
  const 이어시작 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1',
    { attemptId: 시작.attemptId, inputCount: 1, elapsedMs: 1234 });
  for (const 작업 of [시작, 입력, 완료, 중단, 이어시작]) {
    expect(진행작업저장(작업, 저장소)).toBe(true);
    expect(진행작업저장(작업, 저장소)).toBe(true);
    const 저장값 = JSON.parse(저장소.getItem(`dt:p:${작업.id}`)!);
    expect(저장값.v).toBe(4);
    expect(저장값.d).toBe(Date.parse(작업.at));
  }
  const 입력저장값 = JSON.parse(저장소.getItem(`dt:p:${입력.id}`)!);
  expect(입력저장값.keys).toBe("AB+C7␠↵⌫`-=[]\\;',./+/+~8:Unmapped");
  expect(진행작업읽기(저장소)).toEqual([시작, 입력, 완료, 중단, 이어시작]);
  expect(JSON.stringify(입력저장값).length).toBeLessThan(JSON.stringify(입력).length / 2);
});

it('이전 상세 기록을 읽으면서 같은 키의 압축 형식으로 갱신한다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 입력 = 입력묶음(시작.attemptId, 0,
    Array.from({ length: 20 }, () => ({ code: 'KeyA', shift: true })), 2100);
  const 이전 = [시작, 입력];
  for (const 작업 of 이전) {
    저장소.setItem(`hallatype:progress:v2:op:${작업.id}`, JSON.stringify(작업));
  }
  expect(진행작업읽기(저장소)).toEqual(이전);
  for (const 작업 of 이전) {
    const 저장값 = JSON.parse(저장소.getItem(`dt:p:${작업.id}`)!);
    expect(저장값.v).toBe(4);
    expect(저장소.getItem(`hallatype:progress:v2:op:${작업.id}`)).toBeNull();
    expect(진행작업저장(작업, 저장소)).toBe(true);
  }
  expect(시도목록(진행작업읽기(저장소))[0].입력들).toEqual(입력.keys);
});

it('이전 키 배열 형식도 문자열로 바꾸며 입력을 잃지 않는다', () => {
  const 저장소 = 메모리저장소();
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 입력 = 입력묶음(시작.attemptId, 0,
    [{ code: 'KeyA', shift: false }, { code: 'KeyB', shift: false },
      { code: 'KeyC', shift: true }, { code: 'Unmapped', shift: true }], 1000);
  const 이전키 = `hallatype:progress:v2:op:${입력.id}`;
  저장소.setItem(이전키, JSON.stringify({ v: 3, i: 입력.id, a: 입력.attemptId,
    d: Date.parse(입력.at), t: 'i', n: 0, keys: ['A', 'B', '+C', '+~Unmapped'], e: 1000 }));
  expect(진행작업읽기(저장소)).toEqual([입력]);
  const 저장값 = JSON.parse(저장소.getItem(`dt:p:${입력.id}`)!);
  expect(저장값.v).toBe(4);
  expect(저장값.keys).toBe('AB+C+~8:Unmapped');
  expect(저장소.getItem(이전키)).toBeNull();
});

it('tf 키의 압축 기록과 더 오래된 중복 기록을 dt 키로 옮긴다', () => {
  const 작업 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 임시저장소 = 메모리저장소();
  expect(진행작업저장(작업, 임시저장소)).toBe(true);
  const 저장소 = 메모리저장소();
  const 이전키 = `tf:p:${작업.id}`;
  const 옛키 = `hallatype:progress:v2:op:${작업.id}`;
  저장소.setItem(이전키, 임시저장소.getItem(`dt:p:${작업.id}`)!);
  저장소.setItem(옛키, JSON.stringify(작업));
  expect(진행작업읽기(저장소)).toEqual([작업]);
  expect(저장소.getItem(`dt:p:${작업.id}`)).not.toBeNull();
  expect(저장소.getItem(이전키)).toBeNull();
  expect(저장소.getItem(옛키)).toBeNull();
  expect(진행기록키인가(이전키)).toBe(true);
  expect(진행작업저장(작업, 저장소)).toBe(true);

  const 입력 = 입력묶음(작업.attemptId, 0, [{ code: 'KeyA', shift: false }], 100);
  expect(진행작업저장(입력, 임시저장소)).toBe(true);
  저장소.setItem(`tf:p:${입력.id}`, 임시저장소.getItem(`dt:p:${입력.id}`)!);
  expect(진행작업저장(입력, 저장소)).toBe(true);
  expect(저장소.getItem(`dt:p:${입력.id}`)).not.toBeNull();
  expect(저장소.getItem(`tf:p:${입력.id}`)).toBeNull();
});

it.each(['tf:p:', 'hallatype:progress:v2:op:'])(
  '새 키에 쓸 공간이 없으면 %s 기록을 보존하고 계속 읽는다', (접두사) => {
    const 작업 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
    const 이전키 = `${접두사}${작업.id}`;
    const 원본저장소 = 메모리저장소();
    const 임시저장소 = 메모리저장소();
    expect(진행작업저장(작업, 임시저장소)).toBe(true);
    원본저장소.setItem(이전키, 접두사 === 'tf:p:'
      ? 임시저장소.getItem(`dt:p:${작업.id}`)! : JSON.stringify(작업));
    const 저장소: 저장소 = {
      get length() { return 원본저장소.length; },
      key: (번호) => 원본저장소.key(번호),
      getItem: (키) => 원본저장소.getItem(키),
      setItem: (키, 값) => {
        if (키.startsWith('dt:p:')) { throw new Error('QuotaExceededError'); }
        원본저장소.setItem(키, 값);
      },
      removeItem: (키) => 원본저장소.removeItem(키),
    };
    expect(진행작업읽기(저장소)).toEqual([작업]);
    expect(저장소.getItem(이전키)).not.toBeNull();
    expect(저장소.getItem(`dt:p:${작업.id}`)).toBeNull();
    expect(진행작업저장(작업, 저장소)).toBe(true);
  },
);

it('새 키와 이전 키에 같은 작업이 함께 있으면 한 번만 읽고 이전 키를 지운다', () => {
  const 저장소 = 메모리저장소();
  const 작업 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 이전키 = `hallatype:progress:v2:op:${작업.id}`;
  const 새키 = `dt:p:${작업.id}`;
  expect(새키.length).toBeLessThan(이전키.length);
  저장소.setItem(이전키, JSON.stringify(작업));
  expect(진행작업저장(작업, 저장소)).toBe(true);
  저장소.setItem(이전키, JSON.stringify(작업));
  expect(진행작업읽기(저장소)).toEqual([작업]);
  expect(저장소.getItem(이전키)).toBeNull();
  expect(저장소.getItem(새키)).not.toBeNull();
  expect(진행기록키인가(새키)).toBe(true);
  expect(진행기록키인가(이전키)).toBe(true);
  expect(진행기록키인가(null)).toBe(false);
});

it('기존 기록 때문에 저장 공간이 부족해도 읽으면서 공간을 회수한다', () => {
  const 시작 = 시도시작(연습지문들[0].id, '2026-10-24', 'v1');
  const 키들 = Array.from({ length: 20 }, () => ({ code: 'KeyA', shift: true }));
  const 이전 = 입력묶음(시작.attemptId, 0, 키들, 2100);
  const 새입력 = 입력묶음(시작.attemptId, 1, 키들, 4200);
  const 이전키 = `hallatype:progress:v2:op:${이전.id}`;
  const 새키 = `dt:p:${새입력.id}`;
  const 임시저장소 = 메모리저장소();
  expect(진행작업저장(새입력, 임시저장소)).toBe(true);
  const 새길이 = 임시저장소.getItem(새키)!.length;
  const 저장소 = 메모리저장소(이전키.length + JSON.stringify(이전).length + 새키.length + 새길이 - 1);
  저장소.setItem(이전키, JSON.stringify(이전));
  expect(진행작업저장(새입력, 저장소)).toBe(false);
  expect(진행작업읽기(저장소)).toEqual([이전]);
  expect(진행작업저장(새입력, 저장소)).toBe(true);
  expect(진행작업읽기(저장소)).toEqual([이전, 새입력]);
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
  const 시작 = { ...시도시작(지문ID, '2026-10-23', 'v1'), at: '2026-10-23T01:00:00.000Z' };
  const 입력 = { ...입력묶음(시작.attemptId, 0, [{ code: 'KeyR', shift: false }], 100),
    at: '2026-10-23T01:01:00.000Z' };
  expect(지문입력상태(시도목록([시작, 입력]), 지문ID, 'v1')).toBe('입력 중');
  const 완료 = { ...시도완료(시작.attemptId, 200, 2, 1), at: '2026-10-23T01:02:00.000Z' };
  expect(지문입력상태(시도목록([시작, 입력, 완료]), 지문ID, 'v1')).toBe('완료');
  const 다음날 = { ...시도시작(지문ID, '2026-10-24', 'v1'), at: '2026-10-24T01:00:00.000Z' };
  const 다음입력 = { ...입력묶음(다음날.attemptId, 0, [{ code: 'KeyA', shift: false }], 100),
    at: '2026-10-24T01:01:00.000Z' };
  const 다시입력중 = 시도목록([시작, 입력, 완료, 다음날, 다음입력]);
  expect(지문입력상태(다시입력중, 지문ID, 'v1'))
    .toBe('입력 중');
  expect(지문최고정타율(다시입력중, 지문ID, 'v1')).toBe(50);
  expect(지문입력상태(시도목록([시작, 입력, 완료]), 지문ID, 'v2')).toBe('미완료');
  expect(정타율(2, 3)).toBe('66.67');
  expect(정타율(2, 2)).toBe('100');
  expect(정타율(0, 0)).toBe('0.00');
  expect(정타율표시(100)).toBe('100');
  expect(정타율표시(97.5)).toBe('97.50');
});

it('완료 전에 남은 미완료 입력은 재개하지 않고 완료 후 입력은 재개한다', () => {
  const 지문ID = 연습지문들[0].id;
  const 이전시작 = { ...시도시작(지문ID, '2026-10-24', 'v1'), at: '2026-10-24T01:00:00.000Z' };
  const 이전입력 = { ...입력묶음(이전시작.attemptId, 0, [{ code: 'KeyA', shift: false }], 100),
    at: '2026-10-24T01:01:00.000Z' };
  const 완료시작 = { ...시도시작(지문ID, '2026-10-24', 'v1'), at: '2026-10-24T02:00:00.000Z' };
  const 완료 = { ...시도완료(완료시작.attemptId, 200, 2, 2), at: '2026-10-24T02:01:00.000Z' };
  const 완료전 = 시도목록([이전시작, 이전입력, 완료시작, 완료]);
  expect(지문입력상태(완료전, 지문ID, 'v1')).toBe('완료');
  expect(지문최근시도(완료전, 지문ID, 'v1')?.시작.attemptId).toBe(완료시작.attemptId);
  expect(지문재개시도(완료전, 지문ID, 'v1')).toBeUndefined();

  const 새시작 = { ...시도시작(지문ID, '2026-10-24', 'v1'), at: '2026-10-24T03:00:00.000Z' };
  const 새입력 = { ...입력묶음(새시작.attemptId, 0, [{ code: 'KeyB', shift: false }], 100),
    at: '2026-10-24T03:01:00.000Z' };
  const 완료후 = 시도목록([새입력, 완료, 이전입력, 새시작, 완료시작, 이전시작]);
  expect(지문입력상태(완료후, 지문ID, 'v1')).toBe('입력 중');
  expect(지문재개시도(완료후, 지문ID, 'v1')?.시작.attemptId).toBe(새시작.attemptId);
  const 새완료 = { ...시도완료(새시작.attemptId, 200, 2, 2), at: '2026-10-24T03:02:00.000Z' };
  expect(지문입력상태(시도목록([새입력, 새완료, 완료, 이전입력, 새시작,
    완료시작, 이전시작]), 지문ID, 'v1')).toBe('완료');

  const 중단시작 = { ...시도시작(지문ID, '2026-10-24', 'v1'), at: '2026-10-24T04:00:00.000Z' };
  const 중단 = { ...시도중단(중단시작.attemptId), at: '2026-10-24T04:01:00.000Z' };
  const 중단후 = 시도목록([중단, 새완료, 새입력, 중단시작, 새시작, 완료, 완료시작,
    이전입력, 이전시작]);
  expect(지문입력상태(중단후, 지문ID, 'v1')).toBe('미완료');
  expect(지문최고정타율(중단후, 지문ID, 'v1')).toBe(100);
  expect(지문재개시도(중단후, 지문ID, 'v1')).toBeUndefined();
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

it('이전 완료 기록보다 실제 정타율이 높을 때만 PB로 판단한다', () => {
  expect(이번이최고정타율인가(19, 20, null)).toBe(false);
  expect(이번이최고정타율인가(19, 20, 90)).toBe(true);
  expect(이번이최고정타율인가(19, 20, 95)).toBe(false);
  expect(이번이최고정타율인가(18, 20, 95)).toBe(false);
  expect(이번이최고정타율인가(0, 0, null)).toBe(false);
  expect(이번이최고정타율인가(1000000, 1000000, 999999 / 1000000 * 100)).toBe(true);

  const 지문ID = 연습지문들[0].id;
  const 시작 = 시도시작(지문ID, '2026-10-25', 'v1');
  const 시도들 = 시도목록([시작, 시도완료(시작.attemptId, 1000, 1000000, 999999)]);
  const 종전최고 = 지문최고정타율(시도들, 지문ID, 'v1');
  expect(종전최고).toBeCloseTo(99.9999, 4);
  expect(이번이최고정타율인가(1000000, 1000000, 종전최고)).toBe(true);
  expect(지문최고정타율(시도들, 지문ID, 'v1', 시작.attemptId)).toBeNull();
});

it('칭찬 도장은 반올림된 표시값이 아닌 실제 정타율로 정하고 100%를 우선한다', () => {
  const 지문ID = 연습지문들[0].id;
  const 반올림시작 = 시도시작(지문ID, '2026-10-24', 'v1');
  const 반올림완료 = 시도완료(반올림시작.attemptId, 1000, 1000000, 999999);
  const 만점시작 = 시도시작(지문ID, '2026-10-25', 'v2');
  const 만점완료 = 시도완료(만점시작.attemptId, 1000, 10, 10);
  const 시도들 = 시도목록([반올림시작, 반올림완료, 만점시작, 만점완료]);

  expect(정타율(999999, 1000000)).toBe('100');
  expect(완전정타인가(반올림완료)).toBe(false);
  expect(완전정타인가(만점완료)).toBe(true);
  expect(완전정타인가(시도완료(만점시작.attemptId, 1000, 0, 0))).toBe(false);
  expect(정타도장(94, 100)).toBe('완료');
  expect(정타도장(95, 100)).toBe('완료');
  expect(정타도장(97, 100)).toBe('완료');
  expect(정타도장(98, 100)).toBe('잘했어요');
  expect(정타도장(999999, 1000000)).toBe('잘했어요');
  expect(정타도장(10, 10)).toBe('참잘했어요');
  expect(정타도장(0, 0)).toBeNull();
  expect(지문도장등급(시도들, 지문ID, 'v1')).toBe('잘했어요');
  expect(지문도장등급(시도들, 지문ID, 'v2')).toBe('참잘했어요');
  expect(지문도장등급(시도들, 연습지문들[1].id, 'v1')).toBeNull();
});

it('한 지문의 여러 완료 기록에서는 가장 높은 도장을 남긴다', () => {
  const 지문ID = 연습지문들[0].id;
  const 첫완료시작 = 시도시작(지문ID, '2026-10-23', 'v1');
  const 잘함시작 = 시도시작(지문ID, '2026-10-24', 'v1');
  const 만점시작 = 시도시작(지문ID, '2026-10-25', 'v1');
  const 뒤의잘함시작 = 시도시작(지문ID, '2026-10-26', 'v1');
  const 시도들 = 시도목록([
    첫완료시작, 시도완료(첫완료시작.attemptId, 1000, 50, 47),
    잘함시작, 시도완료(잘함시작.attemptId, 1000, 50, 49),
    만점시작, 시도완료(만점시작.attemptId, 1000, 20, 20),
    뒤의잘함시작, 시도완료(뒤의잘함시작.attemptId, 1000, 50, 49),
  ]);
  expect(지문도장등급(시도들.slice(0, 1), 지문ID, 'v1')).toBe('완료');
  expect(지문도장등급(시도들, 지문ID, 'v1')).toBe('참잘했어요');
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
