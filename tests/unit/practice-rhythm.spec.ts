import { 빈리듬그래프, 완료리듬그래프, 입력리듬, 리듬막대갱신 } from '@/practice-rhythm';
import { 시도목록, 시도시작, 시도완료, 입력묶음, 진행작업읽기, 진행작업저장,
  type 저장소 } from '@/practice-progress';

describe('실시간 입력 리듬', () => {
  it('일정한 속도의 정타는 높게 유지하고 오타와 정정에는 완만하게 반응한다', () => {
    const 리듬 = new 입력리듬();
    expect(리듬.입력(true, 0)).toBe(88);
    expect(리듬.입력(true, 300)).toBe(88);
    expect(리듬.입력(true, 600)).toBe(88);
    expect(리듬.입력(false, 900)).toBe(72);
    expect(리듬.입력(true, 1200)).toBe(75);
  });

  it('자신의 최근 입력 간격보다 늦으면 낮아지고 일정한 새 리듬에 적응한다', () => {
    const 리듬 = new 입력리듬();
    [0, 300, 600, 900, 1200].forEach((시각) => 리듬.입력(true, 시각));
    const 느려진직후 = 리듬.입력(true, 1800);
    expect(느려진직후).toBe(82);
    let 적응한높이 = 느려진직후;
    for (let 시각 = 2400; 시각 <= 7800; 시각 += 600) {
      적응한높이 = 리듬.입력(true, 시각);
    }
    expect(적응한높이).toBeGreaterThan(느려진직후);
  });

  it('글 전체를 100칸에 고정해 채우고 같은 칸의 오타 이력을 남긴다', () => {
    let 막대들 = 빈리듬그래프();
    막대들 = 리듬막대갱신(막대들, 0, 200, 72, true);
    막대들 = 리듬막대갱신(막대들, 1, 200, 75, false);
    expect(막대들[0]).toEqual({ 높이: 75, 오타: true });
    막대들 = 리듬막대갱신(막대들, 100, 200, 80, false);
    expect(막대들[50]).toEqual({ 높이: 80, 오타: false });
    expect(막대들[99]).toBeNull();
    막대들 = 리듬막대갱신(막대들, 200, 200, 88, false);
    expect(막대들.filter(Boolean)).toHaveLength(100);
    expect(막대들[99]).toEqual({ 높이: 88, 오타: false });
  });

  it('리로드 후 이어 쓴 입력도 저장 기록만으로 전체 히스토그램을 재생한다', () => {
    const 항목들 = new Map<string, string>();
    const 저장소: 저장소 = {
      get length() { return 항목들.size; },
      key: (번호) => [...항목들.keys()][번호] ?? null,
      getItem: (키) => 항목들.get(키) ?? null,
      setItem: (키, 값) => { 항목들.set(키, 값); },
      removeItem: (키) => { 항목들.delete(키); },
    };
    const 첫시작 = 시도시작('aQmRtYpLsDne', '2026-10-24', 'v1');
    const 첫입력 = 입력묶음(첫시작.attemptId, 0, [
      { code: 'KeyR', shift: false, elapsedMs: 100 },
      { code: 'KeyK', shift: false, elapsedMs: 300 },
    ], 300);
    for (const 작업 of [첫시작, 첫입력]) { expect(진행작업저장(작업, 저장소)).toBe(true); }

    const [복원] = 시도목록(진행작업읽기(저장소));
    const 이어시작 = 시도시작('aQmRtYpLsDne', '2026-10-24', 'v1',
      { attemptId: 복원.시작.attemptId, inputCount: 복원.입력들.length,
        elapsedMs: 복원.걸린밀리초 });
    const 이어입력 = 입력묶음(이어시작.attemptId, 0, [
      { code: 'KeyT', shift: false, elapsedMs: 600 },
      { code: 'KeyS', shift: false, elapsedMs: 900 },
      { code: 'KeyK', shift: false, elapsedMs: 1200 },
    ], 1200);
    const 완료 = 시도완료(이어시작.attemptId, 1200, 5, 4);
    for (const 작업 of [이어시작, 이어입력, 완료]) {
      expect(진행작업저장(작업, 저장소)).toBe(true);
    }
    const 시도 = 시도목록(진행작업읽기(저장소))
      .find((후보) => 후보.시작.attemptId === 이어시작.attemptId)!;
    expect(시도.입력들.map((키) => 키.elapsedMs)).toEqual([100, 300, 600, 900, 1200]);
    const 막대들 = 완료리듬그래프('가나', 시도.입력들, 완료.elapsedMs);
    expect(막대들).toHaveLength(100);
    expect(막대들.every((막대) => 막대 !== null)).toBe(true);
    expect(막대들.slice(0, 50).some((막대) => 막대!.높이 > 16)).toBe(true);
    expect(막대들.some((막대) => 막대?.오타)).toBe(true);
    expect(막대들).toEqual(완료리듬그래프('가나', [...첫입력.keys, ...이어입력.keys], 1200));
  });

  it('키별 시각이 없는 이전 기록도 글 전체를 빈칸 없이 그린다', () => {
    const 막대들 = 완료리듬그래프('가나', [
      { code: 'KeyR', shift: false }, { code: 'KeyK', shift: false },
      { code: 'KeyS', shift: false }, { code: 'KeyK', shift: false },
    ], 1200);
    expect(막대들).toHaveLength(100);
    expect(막대들.every((막대) => 막대 !== null)).toBe(true);
    expect(막대들[0]!.높이).toBeGreaterThan(16);
  });
});
