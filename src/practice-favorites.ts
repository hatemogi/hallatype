import { 테마별지문들, type 연습지문, type 지문테마 } from './practice-passages';

export const 즐겨찾기저장키 = 'dt:favorites:v1';
export type 즐겨찾기저장소 = Pick<Storage, 'getItem' | 'setItem'>;

const 전체지문 = new Map<string, { 테마: 지문테마; 지문: 연습지문 }>();
for (const [테마, 지문들] of Object.entries(테마별지문들) as [지문테마, readonly 연습지문[]][]) {
  for (const 지문 of 지문들) { 전체지문.set(지문.id, { 테마, 지문 }); }
}

function 브라우저저장소(): 즐겨찾기저장소 | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch (_) { return undefined; }
}

/** 저장 순서를 유지하고 삭제되거나 손상된 지문 ID는 제외한다. */
export function 즐겨찾기정리(값: unknown): string[] {
  if (!Array.isArray(값)) { return []; }
  return [...new Set(값.filter((id): id is string =>
    typeof id === 'string' && 전체지문.has(id)))];
}

export function 즐겨찾기읽기(저장소: 즐겨찾기저장소 | undefined = 브라우저저장소()): string[] {
  try {
    const 원문 = 저장소?.getItem(즐겨찾기저장키);
    return 원문 ? 즐겨찾기정리(JSON.parse(원문)) : [];
  } catch (_) { return []; }
}

export function 즐겨찾기저장(ids: readonly string[],
  저장소: 즐겨찾기저장소 | undefined = 브라우저저장소()): boolean {
  try {
    if (!저장소) { return false; }
    저장소.setItem(즐겨찾기저장키, JSON.stringify(즐겨찾기정리(ids)));
    return true;
  } catch (_) { return false; }
}

export function 즐겨찾기바꾸기(ids: readonly string[], 지문ID: string): string[] {
  const 현재 = 즐겨찾기정리(ids);
  if (!전체지문.has(지문ID)) { return 현재; }
  return 현재.includes(지문ID) ? 현재.filter((id) => id !== 지문ID) : [...현재, 지문ID];
}

export function 즐겨찾기지문들(ids: readonly string[]): 연습지문[] {
  return 즐겨찾기정리(ids).map((id) => 전체지문.get(id)!.지문);
}

export function 지문원래테마(지문ID: string): 지문테마 | undefined {
  return 전체지문.get(지문ID)?.테마;
}
