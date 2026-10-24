import { 테마별지문들, type 연습지문, type 지문테마 } from './practice-passages';
import { 본문버전, 지문입력상태, 지문재개시도, type 필사시도 } from './practice-progress';

export type 지문선택 = { 테마: 지문테마; 지문: 연습지문 };

const 전체선택지: 지문선택[] = (Object.keys(테마별지문들) as 지문테마[])
  .flatMap((테마) => 테마별지문들[테마].map((지문) => ({ 테마, 지문 })));

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

/** 첫 진입은 최근 진행 중인 글, 최근 완료한 글의 다음 미완료 글, 첫 미완료 글 순서다. */
export function 첫진입지문선택(시도들: readonly 필사시도[]): 지문선택 {
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
