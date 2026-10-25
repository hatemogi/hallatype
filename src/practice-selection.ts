import { 테마별지문들, type 연습지문, type 지문테마 } from './practice-passages';
import { 본문버전, 브라우저저장소, 지문입력상태, 지문재개시도, type 필사시도 } from './practice-progress';

export type 지문선택 = { 테마: 지문테마; 지문: 연습지문 };

const 전체선택지: 지문선택[] = (Object.keys(테마별지문들) as 지문테마[])
  .flatMap((테마) => 테마별지문들[테마].map((지문) => ({ 테마, 지문 })));

export const 마지막지문저장키 = 'dt:last-passage:v1';
type 선택저장소 = Pick<Storage, 'getItem' | 'setItem'>;

/** 입력 기록과 별개로, 마지막에 열어 둔 글을 기억한다. */
export function 마지막지문읽기(저장소: 선택저장소 | undefined = 브라우저저장소()): string | undefined {
  try {
    const 지문ID = 저장소?.getItem(마지막지문저장키);
    return 전체선택지.find((선택) => 선택.지문.id === 지문ID)?.지문.id;
  } catch (_) { return undefined; }
}

export function 마지막지문저장(지문ID: string,
  저장소: 선택저장소 | undefined = 브라우저저장소()): boolean {
  if (!전체선택지.some((선택) => 선택.지문.id === 지문ID)) { return false; }
  try {
    if (!저장소) { return false; }
    저장소.setItem(마지막지문저장키, 지문ID);
    return true;
  } catch (_) { return false; }
}

function 진행중선택(선택지: readonly 지문선택[], 시도들: readonly 필사시도[]): 지문선택 | undefined {
  const 진행중 = 선택지.flatMap((선택) => {
    const 시도 = 지문재개시도(시도들, 선택.지문.id, 본문버전(선택.지문.본문));
    return 시도 ? [{ 선택, 시도 }] : [];
  });
  진행중.sort((a, b) => b.시도.마지막시각.localeCompare(a.시도.마지막시각) ||
    b.시도.시작.at.localeCompare(a.시도.시작.at) ||
    b.시도.시작.attemptId.localeCompare(a.시도.시작.attemptId));
  return 진행중[0]?.선택;
}

function 미완료(선택: 지문선택, 시도들: readonly 필사시도[]): boolean {
  return 지문입력상태(시도들, 선택.지문.id, 본문버전(선택.지문.본문)) !== '완료';
}

/** 현재 본문 버전에서 한 번이라도 완료한 글 수를 센다. */
export function 지문모음완료현황(지문들: readonly 연습지문[],
  시도들: readonly 필사시도[]): { 완료: number; 전체: number } {
  const 완료기록 = new Set(시도들.filter((시도) => 시도.완료)
    .map((시도) => `${시도.시작.passageId}:${시도.시작.contentVersion}`));
  return {
    완료: 지문들.filter((지문) => 완료기록.has(`${지문.id}:${본문버전(지문.본문)}`)).length,
    전체: 지문들.length,
  };
}

export function 주제완료현황(테마: 지문테마, 시도들: readonly 필사시도[]): { 완료: number; 전체: number } {
  return 지문모음완료현황(테마별지문들[테마], 시도들);
}

/** 즐겨찾기처럼 여러 주제의 글을 모은 목록도 진행 중, 미완료, 첫 글 순서로 고른다. */
export function 지문모음선택(지문들: readonly 연습지문[],
  시도들: readonly 필사시도[]): 연습지문 | undefined {
  const 선택지 = 전체선택지.filter((선택) => 지문들.some((지문) => 지문.id === 선택.지문.id));
  const 진행중 = 진행중선택(선택지, 시도들)?.지문;
  return 진행중 ?? 지문들.find((지문) =>
    지문입력상태(시도들, 지문.id, 본문버전(지문.본문)) !== '완료') ?? 지문들[0];
}

/** 주제를 고르면 해당 주제의 최근 이어 쓸 글, 첫 미완료 글, 첫 글 순서로 선택한다. */
export function 주제지문선택(테마: 지문테마, 시도들: readonly 필사시도[]): 지문선택 {
  const 선택지 = 전체선택지.filter((선택) => 선택.테마 === 테마);
  return 진행중선택(선택지, 시도들) ?? 선택지.find((선택) => 미완료(선택, 시도들)) ?? 선택지[0];
}

/** 현재 글 뒤부터 주제 순서대로 미완료 글을 찾고, 끝에 닿으면 처음부터 찾는다. */
export function 다음미완료지문(현재ID: string, 시도들: readonly 필사시도[]): 지문선택 {
  const 현재순서 = 전체선택지.findIndex((선택) => 선택.지문.id === 현재ID);
  for (let 이동 = 1; 이동 < 전체선택지.length; 이동++) {
    const 선택 = 전체선택지[(현재순서 + 이동) % 전체선택지.length];
    if (미완료(선택, 시도들)) { return 선택; }
  }
  return 전체선택지[0];
}

/** 마지막 선택을 우선 복원하고, 없으면 기존 입력·완료 기록으로 시작점을 고른다. */
export function 첫진입지문선택(시도들: readonly 필사시도[], 마지막지문ID?: string): 지문선택 {
  const 마지막선택 = 전체선택지.find((선택) => 선택.지문.id === 마지막지문ID);
  if (마지막선택) { return 마지막선택; }
  const 진행중 = 진행중선택(전체선택지, 시도들);
  if (진행중) { return 진행중; }

  const 현재버전 = new Map(전체선택지.map((선택) =>
    [선택.지문.id, 본문버전(선택.지문.본문)]));
  const 최근완료 = 시도들.filter((시도) => 시도.완료 &&
    현재버전.get(시도.시작.passageId) === 시도.시작.contentVersion)
    .sort((a, b) => b.완료!.at.localeCompare(a.완료!.at) ||
      b.시작.attemptId.localeCompare(a.시작.attemptId))[0];
  if (최근완료) { return 다음미완료지문(최근완료.시작.passageId, 시도들); }

  return 전체선택지.find((선택) => 미완료(선택, 시도들)) ?? 전체선택지[0];
}
