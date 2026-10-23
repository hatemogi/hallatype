export interface 필사위치 { 지문번호: number; 편번호: number }

/** 현재 편 다음부터 순서대로 살펴보고, 완료하지 않은 첫 편을 고른다. */
export function 다음미완료편(
  편개수들: readonly number[],
  완료: (지문번호: number, 편번호: number) => boolean,
  현재?: 필사위치,
): 필사위치 | null {
  const 위치들 = 편개수들.flatMap((편개수, 지문번호) =>
    Array.from({ length: 편개수 }, (_, 편번호) => ({ 지문번호, 편번호 })));
  if (!위치들.length) { return null; }
  const 현재번호 = 현재 ? 위치들.findIndex((위치) =>
    위치.지문번호 === 현재.지문번호 && 위치.편번호 === 현재.편번호) : -1;
  for (let 차례 = 1; 차례 <= 위치들.length; 차례++) {
    const 위치 = 위치들[(현재번호 + 차례) % 위치들.length];
    if (!완료(위치.지문번호, 위치.편번호)) { return 위치; }
  }
  return null;
}
