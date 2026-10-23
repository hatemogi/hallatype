import * as 색상 from './색상';

export type 필사테마 = '한지' | '새벽' | '밤';
export type 지문크기 = '보통' | '크게';

export interface 필사설정 {
  테마: 필사테마;
  글자크기: 지문크기;
  커서깜빡임: boolean;
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
};

const 저장키 = 'hallatype-practice-settings-v1';

export function 필사설정읽기(storage?: Pick<Storage, 'getItem'>): 필사설정 {
  try {
    const 저장값 = (storage ?? (typeof window === 'undefined' ? undefined : window.localStorage))?.getItem(저장키);
    if (!저장값) { return { ...기본필사설정 }; }
    const 값: unknown = JSON.parse(저장값);
    if (!값 || typeof 값 !== 'object') { return { ...기본필사설정 }; }
    const 설정 = 값 as Partial<필사설정>;
    return {
      테마: 설정.테마 === '새벽' || 설정.테마 === '밤' ? 설정.테마 : '한지',
      글자크기: 설정.글자크기 === '크게' ? '크게' : '보통',
      커서깜빡임: typeof 설정.커서깜빡임 === 'boolean' ? 설정.커서깜빡임 : true,
    };
  } catch (_) {
    return { ...기본필사설정 };
  }
}

export function 필사설정저장(설정: 필사설정, storage?: Pick<Storage, 'setItem'>) {
  try {
    (storage ?? (typeof window === 'undefined' ? undefined : window.localStorage))
      ?.setItem(저장키, JSON.stringify(설정));
  } catch (_) { /* 저장소 없이 사용 */ }
}
