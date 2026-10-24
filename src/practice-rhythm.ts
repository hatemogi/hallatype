import { 끝글자 } from './글자';
import { 지문틀 } from './본문';
import { 따라그리기틀 } from './따라그리기';
import type { 입력키 } from './practice-progress';

export type 리듬막대 = { 높이: number; 오타: boolean };
export const 리듬칸수 = 100;

export function 빈리듬그래프(): Array<리듬막대 | null> {
  return Array.from({ length: 리듬칸수 }, () => null);
}

/** 진행 위치를 글 전체의 고정된 100칸에 대응시킨다. */
export function 리듬막대갱신(막대들: readonly (리듬막대 | null)[], 진행획수: number,
  전체획수: number, 높이: number, 오타: boolean): Array<리듬막대 | null> {
  const 다음 = [...막대들];
  const 칸 = Math.min(리듬칸수 - 1, Math.floor(진행획수 / 전체획수 * 리듬칸수));
  let 마지막칸 = -1;
  for (let i = 칸; i >= 0; i--) {
    if (다음[i] != null) { 마지막칸 = i; break; }
  }
  for (let i = 마지막칸 + 1; i < 칸; i++) {
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

/** 키별 시각이 없는 이전 저장 기록은 알려진 시각 사이에 고르게 배치한다. */
function 입력시각들(키들: readonly 입력키[], 걸린밀리초: number): number[] {
  const 시각들 = Array<number>(키들.length);
  let 이전위치 = -1;
  let 이전시각 = 0;
  for (let 위치 = 0; 위치 < 키들.length; 위치++) {
    const 저장시각 = 키들[위치].elapsedMs;
    if (저장시각 === undefined) { continue; }
    const 시각 = Math.max(이전시각, 저장시각);
    for (let 빈위치 = 이전위치 + 1; 빈위치 < 위치; 빈위치++) {
      시각들[빈위치] = 이전시각 + (시각 - 이전시각) *
        (빈위치 - 이전위치) / (위치 - 이전위치);
    }
    시각들[위치] = 시각;
    이전위치 = 위치;
    이전시각 = 시각;
  }
  const 끝시각 = Math.max(걸린밀리초, 이전시각 + 키들.length - 이전위치 - 1);
  for (let 위치 = 이전위치 + 1; 위치 < 키들.length; 위치++) {
    시각들[위치] = 이전시각 + (끝시각 - 이전시각) *
      (위치 - 이전위치) / (키들.length - 이전위치 - 1);
  }
  return 시각들;
}

/** 저장된 키 입력을 처음부터 재생해 완료 화면의 막대를 만든다. */
export function 완료리듬그래프(본문: string, 키들: readonly 입력키[],
  걸린밀리초: number): Array<리듬막대 | null> {
  const 지문 = new 지문틀();
  지문.글쓰기(본문);
  지문.쓰기(지문.위치, 끝글자);
  const 따라그리기 = new 따라그리기틀(지문);
  const 리듬 = new 입력리듬();
  const 시각들 = 입력시각들(키들, 걸린밀리초);
  let 막대들 = 빈리듬그래프();
  for (let 순서 = 0; 순서 < 키들.length; 순서++) {
    const 키 = 키들[순서];
    따라그리기.입력(키.code, 키.shift);
    막대들 = 리듬막대갱신(막대들, 따라그리기.진행획수, 따라그리기.전체획수,
      리듬.입력(!따라그리기.방금오타, 시각들[순서]), 따라그리기.방금오타);
  }
  return 막대들;
}
