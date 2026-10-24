export type 리듬막대 = { 높이: number; 오타: boolean; 이전기록?: boolean };
export const 리듬칸수 = 100;

export function 빈리듬그래프(이전진행칸 = 0): Array<리듬막대 | null> {
  return Array.from({ length: 리듬칸수 }, (_, 칸) =>
    칸 < 이전진행칸 ? { 높이: 16, 오타: false, 이전기록: true } : null);
}

/** 진행 위치를 글 전체의 고정된 100칸에 대응시킨다. */
export function 리듬막대갱신(막대들: readonly (리듬막대 | null)[], 진행획수: number,
  전체획수: number, 높이: number, 오타: boolean, 시작칸 = 0): Array<리듬막대 | null> {
  const 다음 = [...막대들];
  const 칸 = Math.min(리듬칸수 - 1, Math.floor(진행획수 / 전체획수 * 리듬칸수));
  let 마지막칸 = -1;
  for (let i = 칸; i >= 0; i--) {
    if (다음[i] != null && !다음[i]?.이전기록) { 마지막칸 = i; break; }
  }
  for (let i = Math.max(시작칸, 마지막칸 + 1); i < 칸; i++) {
    다음[i] = { 높이: 마지막칸 < 0 ? 높이 : 다음[마지막칸]!.높이, 오타: false };
  }
  다음[칸] = { 높이, 오타: 오타 || (다음[칸]?.오타 ?? false) };
  return 다음;
}

/** 최근 입력 간격을 기준으로 정타의 리듬을 그린다. 빠르기 자체의 목표치는 두지 않는다. */
export class 입력리듬 {
  private 이전시각: number | null = null;
  private readonly 최근간격들: number[] = [];
  private 이전높이: number | null = null;

  입력(정타: boolean, 시각: number): number {
    const 간격 = this.이전시각 === null ? null : Math.max(1, 시각 - this.이전시각);
    this.이전시각 = 시각;
    const 정렬된간격 = [...this.최근간격들].sort((a, b) => a - b);
    const 중간 = Math.floor(정렬된간격.length / 2);
    const 기준 = 정렬된간격.length === 0 ? (간격 ?? 1)
      : 정렬된간격.length % 2 ? 정렬된간격[중간]
        : (정렬된간격[중간 - 1] + 정렬된간격[중간]) / 2;
    const 목표높이 = !정타 ? 6 : 간격 === null ? 88
      : Math.max(18, Math.min(96, Math.round(24 + 64 * 기준 / 간격)));
    const 높이 = this.이전높이 === null ? 목표높이
      : Math.round(this.이전높이 * .8 + 목표높이 * .2);
    this.이전높이 = 높이;

    if (정타 && 간격 !== null) {
      this.최근간격들.push(간격);
      if (this.최근간격들.length > 8) { this.최근간격들.shift(); }
    }
    return 높이;
  }
}
