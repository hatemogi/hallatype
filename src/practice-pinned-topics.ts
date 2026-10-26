import { 테마별지문들, type 지문테마 } from './practice-passages';
import { 정식사이트인가 } from './practice-release';

export type 선택주제 = 지문테마 | '즐겨찾기';

/** 화면에 노출할 주제만 관리한다. 다른 지문 테마와 지문은 그대로 보관한다. */
export const 공개주제들: readonly 선택주제[] = [
  '시작하기', '즐겨찾기', '산문', '자기계발', '스포츠',
  '요리레시피', '감정 읽기', '동물', '식물', '우주',
];

export const 전체주제들: readonly 선택주제[] = [
  '시작하기', '즐겨찾기',
  ...(Object.keys(테마별지문들) as 지문테마[]).filter((주제) => 주제 !== '시작하기'),
];

export function 표시주제들(origin?: string): readonly 선택주제[] {
  return 정식사이트인가(origin) ? 공개주제들 : 전체주제들;
}

export function 공개주제인가(주제: 지문테마): boolean {
  return 공개주제들.includes(주제);
}

export function 사용가능지문테마들(origin?: string): readonly 지문테마[] {
  return 표시주제들(origin).filter((주제): 주제 is 지문테마 => 주제 !== '즐겨찾기');
}

export function 주제표시이름(주제: 선택주제): string {
  if (주제 === '요리레시피') { return '요리'; }
  if (주제 === '감정 읽기') { return '감정'; }
  return 주제;
}
