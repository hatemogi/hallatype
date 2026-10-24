import { 테마별지문들, type 연습지문, type 지문테마 } from './practice-passages';
import { 본문버전, 정타율, type 필사시도 } from './practice-progress';
import { 완료리듬그래프, type 리듬막대 } from './practice-rhythm';

export interface 최근완료기록 {
  시도ID: string;
  완료시각: string;
  완료일시: string;
  테마: 지문테마;
  지문: 연습지문;
  정타율: string;
  정타수: number;
  전체타수: number;
  걸린시간: string;
  리듬막대들: Array<리듬막대 | null>;
}

const 지문지도 = new Map<string, { 테마: 지문테마; 지문: 연습지문 }>();
for (const [테마, 지문들] of Object.entries(테마별지문들) as [지문테마, readonly 연습지문[]][]) {
  for (const 지문 of 지문들) { 지문지도.set(지문.id, { 테마, 지문 }); }
}

export function 지문찾기(id: string): { 테마: 지문테마; 지문: 연습지문 } | undefined {
  return 지문지도.get(id);
}

export function 완료시각표시(시각: string): string {
  const 날짜 = new Date(시각);
  const 두자리 = (값: number) => String(값).padStart(2, '0');
  return `${날짜.getFullYear()}/${두자리(날짜.getMonth() + 1)}/${두자리(날짜.getDate())} ` +
    `${두자리(날짜.getHours())}:${두자리(날짜.getMinutes())}`;
}

/** 현재 지문과 일치하는 최근 완료 시도만 골라 저장된 키 입력으로 리듬을 재생한다. */
export function 최근완료기록들(시도들: readonly 필사시도[], 개수 = 10): 최근완료기록[] {
  return 시도들
    .filter((시도) => {
      const 지문 = 지문찾기(시도.시작.passageId)?.지문;
      return !!시도.완료 && !!지문 && 시도.시작.contentVersion === 본문버전(지문.본문);
    })
    .sort((a, b) => b.완료!.at.localeCompare(a.완료!.at) ||
      b.시작.attemptId.localeCompare(a.시작.attemptId))
    .slice(0, 개수)
    .map((시도) => {
      const { 테마, 지문 } = 지문찾기(시도.시작.passageId)!;
      const 완료 = 시도.완료!;
      const 초 = Math.max(1, Math.round(완료.elapsedMs / 1000));
      return {
        시도ID: 시도.시작.attemptId,
        완료시각: 완료.at,
        완료일시: 완료시각표시(완료.at),
        테마,
        지문,
        정타율: 정타율(완료.correctInputs, 완료.totalInputs),
        정타수: 완료.correctInputs,
        전체타수: 완료.totalInputs,
        걸린시간: `${Math.floor(초 / 60)}분 ${초 % 60}초`,
        리듬막대들: 완료리듬그래프(지문.본문, 시도.입력들, 완료.elapsedMs),
      };
    });
}
