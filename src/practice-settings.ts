import * as 색상 from './색상';

export type 필사테마 = '한지' | '새벽' | '밤' | '매트릭스' | 'PC통신';
export type 지문크기 = '보통' | '크게';
export type 안티앨리어싱단계 = 0 | 1 | 2 | 3 | 4;
export const 단계별안티앨리어싱강도 = [0, 50, 100, 200, 300] as const;

export interface 필사설정 {
  테마: 필사테마;
  글자크기: 지문크기;
  커서깜빡임: boolean;
  안티앨리어싱단계: 안티앨리어싱단계;
}

export interface 필사팔레트 {
  종이: 색상.RGBA;
  바탕글: 색상.RGBA;
  먹색: 색상.RGBA;
  커서: 색상.RGBA;
  안내: 색상.RGBA;
}

export const 기본필사설정: 필사설정 = {
  테마: '한지',
  글자크기: '보통',
  커서깜빡임: true,
  안티앨리어싱단계: 2,
};

export const 필사팔레트들: Record<필사테마, 필사팔레트> = {
  한지: {
    종이: 색상.흰색,
    바탕글: 색상.필사바탕글,
    먹색: 색상.필사먹색,
    커서: 색상.필사커서,
    안내: 색상.필사안내,
  },
  새벽: {
    종이: [250, 252, 252, 255],
    바탕글: [143, 159, 166, 255],
    먹색: [48, 68, 79, 255],
    커서: [102, 135, 148, 255],
    안내: [165, 105, 91, 255],
  },
  밤: {
    종이: [34, 44, 49, 255],
    바탕글: [140, 158, 160, 255],
    먹색: [226, 231, 223, 255],
    커서: [184, 176, 137, 255],
    안내: [215, 151, 127, 255],
  },
  매트릭스: {
    종이: [8, 25, 14, 255],
    바탕글: [76, 125, 82, 255],
    먹색: [154, 255, 169, 255],
    커서: [76, 255, 113, 255],
    안내: [249, 186, 113, 255],
  },
  PC통신: {
    종이: [16, 34, 135, 255],
    바탕글: [169, 192, 246, 255],
    먹색: [255, 255, 255, 255],
    커서: [255, 255, 255, 255],
    안내: [255, 205, 162, 255],
  },
};

const 저장키 = 'hallatype-practice-settings-v1';

export function 필사설정읽기(storage?: Pick<Storage, 'getItem'>): 필사설정 {
  try {
    const 저장값 = (storage ?? (typeof window === 'undefined' ? undefined : window.localStorage))?.getItem(저장키);
    if (!저장값) { return { ...기본필사설정 }; }
    const 값: unknown = JSON.parse(저장값);
    if (!값 || typeof 값 !== 'object') { return { ...기본필사설정 }; }
    const 설정 = 값 as Partial<필사설정> & { 안티앨리어싱?: number; 설정버전?: number };
    const 이전강도단계: Record<number, 안티앨리어싱단계> = { 0: 0, 50: 1, 100: 2, 200: 3, 300: 4 };
    const 이전슬라이더단계: 안티앨리어싱단계[] = [0, 1, 2, 3, 3, 4];
    const 단계 = 설정.안티앨리어싱단계;
    return {
      테마: 설정.테마 === '새벽' || 설정.테마 === '밤' ||
        설정.테마 === '매트릭스' || 설정.테마 === 'PC통신' ? 설정.테마 : '한지',
      글자크기: 설정.글자크기 === '크게' ? '크게' : '보통',
      커서깜빡임: typeof 설정.커서깜빡임 === 'boolean' ? 설정.커서깜빡임 : true,
      안티앨리어싱단계: 설정.설정버전 === 2
        ? Number.isInteger(단계) && 단계 !== undefined && 단계 >= 0 && 단계 <= 4 ? 단계 : 2
        : Number.isInteger(단계) && 단계 !== undefined && 단계 >= 0 && 단계 <= 5
          ? 이전슬라이더단계[단계] : 이전강도단계[설정.안티앨리어싱 ?? -1] ?? 2,
    };
  } catch (_) {
    return { ...기본필사설정 };
  }
}

export function 필사설정저장(설정: 필사설정, storage?: Pick<Storage, 'setItem'>) {
  try {
    (storage ?? (typeof window === 'undefined' ? undefined : window.localStorage))
      ?.setItem(저장키, JSON.stringify({ ...설정, 설정버전: 2 }));
  } catch (_) { /* 저장소 없이 사용 */ }
}
