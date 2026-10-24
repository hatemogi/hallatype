import { 빈리듬그래프, 입력리듬, 리듬막대갱신 } from '@/practice-rhythm';

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

  it('이어 쓰기에서 이미 지난 칸의 속도를 추측해 채우지 않는다', () => {
    const 막대들 = 리듬막대갱신(빈리듬그래프(50), 102, 200, 88, false, 50);
    expect(막대들.slice(0, 50)).toEqual(Array(50).fill({ 높이: 16, 오타: false, 이전기록: true }));
    expect(막대들[50]).toEqual({ 높이: 88, 오타: false });
    expect(막대들[51]).toEqual({ 높이: 88, 오타: false });
  });
});
