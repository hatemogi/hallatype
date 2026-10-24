import { 테마별지문들, type 지문테마 } from './practice-passages';

export type 선택주제 = 지문테마 | '즐겨찾기';
export const 고정주제저장키 = 'dt:pinned-topics:v2';
export const 이전고정주제저장키 = 'dt:pinned-topics:v1';
export const 고정주제한도 = 8;
export type 고정주제저장소 = Pick<Storage, 'getItem' | 'setItem'>;

const 지문주제들 = Object.keys(테마별지문들) as 지문테마[];
export const 항상표시주제들: 선택주제[] = ['시작하기', '즐겨찾기'];
export const 선택가능주제들: 선택주제[] = 지문주제들.filter((주제) => 주제 !== '시작하기');
export const 전체주제들: 선택주제[] = [...항상표시주제들, ...선택가능주제들];
export const 기본고정주제들 = 선택가능주제들.slice(0, 고정주제한도);
const 유효주제들 = new Set<선택주제>(선택가능주제들);

export const 주제묶음들: { 이름: string; 주제들: 선택주제[] }[] = [
  { 이름: '마음과 생각', 주제들: ['자기계발', '명상', '자기확언', '스토아 철학', '감정 읽기'] },
  { 이름: '자연과 과학', 주제들: ['우주', '지구', '동물', '식물', '몸과 감각'] },
  { 이름: '문화와 지식', 주제들: ['조선시대', '우리말', '소리와 음악', '도시와 건축', '생활교양'] },
  { 이름: '이야기', 주제들: ['산문', '메밀꽃 필 무렵', '봄봄'] },
  { 이름: '취미와 생활', 주제들: ['스포츠', '요리레시피'] },
];

function 브라우저저장소(): 고정주제저장소 | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch (_) { return undefined; }
}

/** 기존 저장값의 항상 표시 주제도 제외하고, 선택 가능한 주제만 최대 여덟 개 남긴다. */
export function 고정주제정리(값: unknown): 선택주제[] {
  if (!Array.isArray(값)) { return []; }
  return [...new Set(값.filter((주제): 주제 is 선택주제 =>
    typeof 주제 === 'string' && 유효주제들.has(주제 as 선택주제)))].slice(0, 고정주제한도);
}

export function 고정주제읽기(저장소: 고정주제저장소 | undefined = 브라우저저장소()): 선택주제[] {
  try {
    const 원문 = 저장소?.getItem(고정주제저장키);
    if (원문 !== null && 원문 !== undefined) { return 고정주제정리(JSON.parse(원문)); }
    const 이전원문 = 저장소?.getItem(이전고정주제저장키);
    if (이전원문 === null || 이전원문 === undefined) { return [...기본고정주제들]; }
    const 이전선택 = 고정주제정리(JSON.parse(이전원문));
    return 고정주제정리([...이전선택, ...기본고정주제들]);
  } catch (_) { return [...기본고정주제들]; }
}

export function 고정주제저장(주제들: readonly 선택주제[],
  저장소: 고정주제저장소 | undefined = 브라우저저장소()): boolean {
  try {
    if (!저장소) { return false; }
    저장소.setItem(고정주제저장키, JSON.stringify(고정주제정리(주제들)));
    return true;
  } catch (_) { return false; }
}

export function 고정주제바꾸기(현재: readonly 선택주제[], 주제: 선택주제): 선택주제[] {
  const 정리됨 = 고정주제정리(현재);
  if (!유효주제들.has(주제)) { return 정리됨; }
  if (정리됨.includes(주제)) { return 정리됨.filter((항목) => 항목 !== 주제); }
  return 정리됨.length < 고정주제한도 ? [...정리됨, 주제] : 정리됨;
}
