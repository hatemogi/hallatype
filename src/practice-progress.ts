import { customAlphabet } from 'nanoid';

const STORAGE_PREFIX = 'dt:p:';
const LEGACY_STORAGE_PREFIXES = ['tf:p:', 'hallatype:progress:v2:op:'] as const;
const STORAGE_PREFIXES = [STORAGE_PREFIX, ...LEGACY_STORAGE_PREFIXES];
const 새ID = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);
const ID_PATTERN = /^[A-Za-z]{12}$/;
const 버전캐시 = new Map<string, string>();

function ID확인(id: string): void {
  if (!ID_PATTERN.test(id)) { throw new Error('ID는 영문자 12자리여야 합니다.'); }
}

export type 입력키 = { code: string; shift: boolean; elapsedMs?: number };
export type 이어쓰기원본 = { attemptId: string; inputCount: number; elapsedMs: number };

type 작업기본 = { id: string; attemptId: string; schema: 2; at: string };
export type 진행작업 =
  | (작업기본 & { type: 'started'; passageId: string; day: string; contentVersion: string;
      continuedFrom?: 이어쓰기원본 })
  | (작업기본 & { type: 'inputs'; seq: number; keys: 입력키[]; elapsedMs: number })
  | (작업기본 & { type: 'completed'; elapsedMs: number; totalInputs: number; correctInputs: number })
  | (작업기본 & { type: 'abandoned' });

type 저장작업기본 = { v: 4; i: string; a: string; d: number };
type 저장작업 =
  | (저장작업기본 & { t: 's'; p: string; y: string; c: string; f?: [string, number, number] })
  | (저장작업기본 & { t: 'i'; n: number; keys: string; e: number; m?: number[] })
  | (저장작업기본 & { t: 'c'; e: number; n: number; o: number })
  | (저장작업기본 & { t: 'x' });

const 짧은키코드 = new Map(Object.entries({
  Space: '␠', Enter: '↵', Backspace: '⌫', Backquote: '`', Minus: '-', Equal: '=',
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
  Comma: ',', Period: '.', Slash: '/',
}));
const 원래키코드 = new Map([...짧은키코드].map(([코드, 글자]) => [글자, 코드]));

function 입력키압축(키: 입력키): string {
  const 코드 = /^Key[A-Z]$/.test(키.code) ? 키.code.slice(3)
    : /^Digit[0-9]$/.test(키.code) ? 키.code.slice(5)
      : 짧은키코드.get(키.code) ?? `~${키.code.length}:${키.code}`;
  return `${키.shift ? '+' : ''}${코드}`;
}

function 입력키복원(표현: string): 입력키 | undefined {
  const shift = 표현.startsWith('+');
  const 글자 = shift ? 표현.slice(1) : 표현;
  const code = /^[A-Z]$/.test(글자) ? `Key${글자}`
    : /^[0-9]$/.test(글자) ? `Digit${글자}`
      : 원래키코드.get(글자) ?? (글자.startsWith('~') ? 글자.slice(1) : undefined);
  return code === undefined ? undefined : { code, shift };
}

/** v4 문자열에서 +는 바로 다음 키의 Shift를 뜻하고, ~길이:코드는 알 수 없는 키를 보존한다. */
function 입력키열복원(표현: string): 입력키[] | undefined {
  const 키들: 입력키[] = [];
  let 위치 = 0;
  while (위치 < 표현.length) {
    const shift = 표현[위치] === '+';
    if (shift) { 위치++; }
    if (위치 >= 표현.length) { return undefined; }
    if (표현[위치] === '~') {
      const 길이시작 = ++위치;
      while (위치 < 표현.length && /[0-9]/.test(표현[위치])) { 위치++; }
      if (위치 === 길이시작 || 표현[위치] !== ':') { return undefined; }
      const 길이 = Number(표현.slice(길이시작, 위치++));
      if (!Number.isSafeInteger(길이) || 길이 > 표현.length - 위치) { return undefined; }
      키들.push({ code: 표현.slice(위치, 위치 + 길이), shift });
      위치 += 길이;
    } else {
      const 키 = 입력키복원(`${shift ? '+' : ''}${표현[위치++]}`);
      if (!키) { return undefined; }
      키들.push(키);
    }
  }
  return 키들.length ? 키들 : undefined;
}

/** 메모리에서는 기존 작업 구조를 쓰고, 저장할 때만 키와 시각을 압축한다. */
function 작업압축(작업: 진행작업): 저장작업 | undefined {
  const d = Date.parse(작업.at);
  if (!Number.isSafeInteger(d)) { return undefined; }
  const 기본 = { v: 4 as const, i: 작업.id, a: 작업.attemptId, d };
  switch (작업.type) {
    case 'started': return { ...기본, t: 's', p: 작업.passageId, y: 작업.day,
      c: 작업.contentVersion, ...(작업.continuedFrom && { f: [작업.continuedFrom.attemptId,
        작업.continuedFrom.inputCount, 작업.continuedFrom.elapsedMs] as [string, number, number] }) };
    case 'inputs': return { ...기본, t: 'i', n: 작업.seq,
      keys: 작업.keys.map(입력키압축).join(''), e: 작업.elapsedMs,
      ...(작업.keys.every((키) => 키.elapsedMs !== undefined) &&
        { m: 작업.keys.map((키) => 키.elapsedMs!) }) };
    case 'completed': return { ...기본, t: 'c', e: 작업.elapsedMs,
      n: 작업.totalInputs, o: 작업.correctInputs };
    case 'abandoned': return { ...기본, t: 'x' };
  }
}

function 작업복원(값: unknown): 진행작업 | undefined {
  if (올바른작업(값)) { return 값; }
  if (!값 || typeof 값 !== 'object') { return undefined; }
  const 압축 = 값 as Record<string, unknown>;
  if ((압축.v !== 3 && 압축.v !== 4) || typeof 압축.i !== 'string' || typeof 압축.a !== 'string' ||
      typeof 압축.d !== 'number' || !Number.isSafeInteger(압축.d)) { return undefined; }
  const 날짜 = new Date(압축.d);
  if (Number.isNaN(날짜.getTime())) { return undefined; }
  const 기본 = { schema: 2 as const, id: 압축.i, attemptId: 압축.a, at: 날짜.toISOString() };
  let 작업: 진행작업;
  switch (압축.t) {
    case 's': {
      const f = 압축.f;
      if (f !== undefined && (!Array.isArray(f) || f.length !== 3)) { return undefined; }
      작업 = { ...기본, type: 'started', passageId: 압축.p as string,
        day: 압축.y as string, contentVersion: 압축.c as string,
        ...(f && { continuedFrom: { attemptId: f[0], inputCount: f[1], elapsedMs: f[2] } }) };
      break;
    }
    case 'i': {
      let 키들: 입력키[] | undefined;
      if (압축.v === 3 && Array.isArray(압축.keys) && 압축.keys.length &&
          압축.keys.every((키) => typeof 키 === 'string')) {
        const 복원 = 압축.keys.map((키) => 입력키복원(키));
        if (복원.every((키) => 키 !== undefined)) { 키들 = 복원 as 입력키[]; }
      } else if (압축.v === 4 && typeof 압축.keys === 'string') {
        키들 = 입력키열복원(압축.keys);
      }
      if (!키들) { return undefined; }
      if (압축.m !== undefined) {
        if (압축.v !== 4 || !Array.isArray(압축.m) || 압축.m.length !== 키들.length ||
            !압축.m.every((시각) => typeof 시각 === 'number' && Number.isFinite(시각) && 시각 >= 0)) {
          return undefined;
        }
        const 시각들 = 압축.m as number[];
        키들 = 키들.map((키, 순서) => ({ ...키, elapsedMs: 시각들[순서] }));
      }
      작업 = { ...기본, type: 'inputs', seq: 압축.n as number,
        keys: 키들, elapsedMs: 압축.e as number };
      break;
    }
    case 'c': 작업 = { ...기본, type: 'completed', elapsedMs: 압축.e as number,
      totalInputs: 압축.n as number, correctInputs: 압축.o as number }; break;
    case 'x': 작업 = { ...기본, type: 'abandoned' }; break;
    default: return undefined;
  }
  return 올바른작업(작업) ? 작업 : undefined;
}

export type 저장소 = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

export function 진행기록키인가(키: string | null): boolean {
  return 키 !== null && STORAGE_PREFIXES.some((접두사) => 키.startsWith(접두사));
}

export interface 필사시도 {
  시작: Extract<진행작업, { type: 'started' }>;
  입력들: 입력키[];
  다음순서: number;
  걸린밀리초: number;
  마지막시각: string;
  완료?: Extract<진행작업, { type: 'completed' }>;
  중단됨: boolean;
  복원가능: boolean;
}

/** 같은 본문의 가장 최근 시도를 고른다. */
export function 지문최근시도(시도들: readonly 필사시도[], passageId: string,
  contentVersion: string): 필사시도 | undefined {
  return 시도들
    .filter((시도) => 시도.시작.passageId === passageId &&
      시도.시작.contentVersion === contentVersion)
    .sort((a, b) => b.마지막시각.localeCompare(a.마지막시각) ||
      b.시작.at.localeCompare(a.시작.at) ||
      b.시작.attemptId.localeCompare(a.시작.attemptId))[0];
}

export function 지문입력상태(시도들: readonly 필사시도[], passageId: string,
  contentVersion: string): '완료' | '입력 중' | '미완료' {
  const 최근 = 지문최근시도(시도들, passageId, contentVersion);
  if (최근?.완료) { return '완료'; }
  if (최근?.복원가능 && !최근.중단됨 && 최근.입력들.length > 0) { return '입력 중'; }
  return '미완료';
}

export function 지문재개시도(시도들: readonly 필사시도[], passageId: string,
  contentVersion: string): 필사시도 | undefined {
  const 최근 = 지문최근시도(시도들, passageId, contentVersion);
  return 최근?.복원가능 && !최근.완료 && !최근.중단됨 && 최근.입력들.length > 0
    ? 최근 : undefined;
}

export function 정타율(정타수: number, 전체타수: number): string {
  return 전체타수 > 0 ? 정타율표시(정타수 / 전체타수 * 100) : '0.00';
}

export function 정타율표시(비율: number): string {
  const 표시 = 비율.toFixed(2);
  return 표시 === '100.00' ? '100' : 표시;
}

/** 반올림된 표시값과 구별해 실제 모든 입력이 정타였는지 확인한다. */
export function 완전정타인가(완료: 필사시도['완료']): boolean {
  return !!완료 && 완료.totalInputs > 0 && 완료.correctInputs === 완료.totalInputs;
}

export type 칭찬도장종류 = '참잘했어요' | '잘했어요';

/** 기록의 원래 타수로 등급을 정한다. 표시 정타율의 반올림은 사용하지 않는다. */
export function 정타도장(정타수: number, 전체타수: number): 칭찬도장종류 | null {
  if (전체타수 <= 0) { return null; }
  if (정타수 === 전체타수) { return '참잘했어요'; }
  return 정타수 * 100 >= 전체타수 * 98 ? '잘했어요' : null;
}

export function 지문도장등급(시도들: readonly 필사시도[], passageId: string,
  contentVersion: string): 칭찬도장종류 | null {
  let 등급: 칭찬도장종류 | null = null;
  for (const 시도 of 시도들) {
    if (시도.시작.passageId !== passageId || 시도.시작.contentVersion !== contentVersion ||
        !시도.완료) { continue; }
    const 이번 = 정타도장(시도.완료.correctInputs, 시도.완료.totalInputs);
    if (이번 === '참잘했어요') { return 이번; }
    if (이번 === '잘했어요') { 등급 = 이번; }
  }
  return 등급;
}

/** 화면에 표시하는 정타율을 기준으로 첫 기록, 갱신, 동률을 최고 기록으로 본다. */
export function 이번이최고정타율인가(정타수: number, 전체타수: number,
  종전최고: number | null): boolean {
  return 전체타수 > 0 && (종전최고 === null || Number(정타율(정타수, 전체타수)) >= 종전최고);
}

/** 같은 본문의 완료 기록 중 가장 높은 정타율을 반환한다. */
export function 지문최고정타율(시도들: readonly 필사시도[], passageId: string,
  contentVersion: string, 제외시도ID?: string): number | null {
  let 최고: number | null = null;
  for (const 시도 of 시도들) {
    if (시도.시작.passageId !== passageId || 시도.시작.contentVersion !== contentVersion ||
        시도.시작.attemptId === 제외시도ID || !시도.완료) { continue; }
    const 비율 = Number(정타율(시도.완료.correctInputs, 시도.완료.totalInputs));
    최고 = 최고 === null ? 비율 : Math.max(최고, 비율);
  }
  return 최고;
}

export function 브라우저저장소(): 저장소 | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch (_) { return undefined; }
}

/** 본문이 달라지면 기존 입력을 다른 내용에 재생하지 않는다. */
export function 본문버전(본문: string): string {
  const 캐시 = 버전캐시.get(본문);
  if (캐시) { return 캐시; }
  let 해시 = 0xcbf29ce484222325n;
  for (const 바이트 of new TextEncoder().encode(본문)) {
    해시 = BigInt.asUintN(64, (해시 ^ BigInt(바이트)) * 0x100000001b3n);
  }
  const 버전 = `fnv1a64:${해시.toString(16).padStart(16, '0')}`;
  버전캐시.set(본문, 버전);
  return 버전;
}

function 올바른작업(값: unknown): 값 is 진행작업 {
  if (!값 || typeof 값 !== 'object') { return false; }
  const 작업 = 값 as Record<string, unknown>;
  if (작업.schema !== 2 || typeof 작업.id !== 'string' || !ID_PATTERN.test(작업.id) ||
      typeof 작업.attemptId !== 'string' || !ID_PATTERN.test(작업.attemptId) ||
      typeof 작업.at !== 'string') { return false; }
  switch (작업.type) {
    case 'started':
      return typeof 작업.passageId === 'string' && ID_PATTERN.test(작업.passageId) &&
        typeof 작업.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(작업.day) &&
        typeof 작업.contentVersion === 'string' &&
        (작업.continuedFrom === undefined || (!!작업.continuedFrom && typeof 작업.continuedFrom === 'object' &&
          typeof (작업.continuedFrom as 이어쓰기원본).attemptId === 'string' &&
          ID_PATTERN.test((작업.continuedFrom as 이어쓰기원본).attemptId) &&
          Number.isSafeInteger((작업.continuedFrom as 이어쓰기원본).inputCount) &&
          (작업.continuedFrom as 이어쓰기원본).inputCount >= 0 &&
          typeof (작업.continuedFrom as 이어쓰기원본).elapsedMs === 'number' &&
          Number.isFinite((작업.continuedFrom as 이어쓰기원본).elapsedMs) &&
          (작업.continuedFrom as 이어쓰기원본).elapsedMs >= 0));
    case 'inputs':
      return Number.isSafeInteger(작업.seq) && (작업.seq as number) >= 0 &&
        typeof 작업.elapsedMs === 'number' && Number.isFinite(작업.elapsedMs) && 작업.elapsedMs >= 0 &&
        Array.isArray(작업.keys) && 작업.keys.length > 0 &&
        작업.keys.every((키: unknown) => !!키 && typeof 키 === 'object' &&
          typeof (키 as 입력키).code === 'string' && typeof (키 as 입력키).shift === 'boolean' &&
          ((키 as 입력키).elapsedMs === undefined ||
            (typeof (키 as 입력키).elapsedMs === 'number' &&
              Number.isFinite((키 as 입력키).elapsedMs) && (키 as 입력키).elapsedMs! >= 0)));
    case 'completed':
      return ['elapsedMs', 'totalInputs', 'correctInputs'].every((필드) =>
        typeof 작업[필드] === 'number' && Number.isFinite(작업[필드]) && (작업[필드] as number) >= 0);
    case 'abandoned': return true;
    default: return false;
  }
}

/** 서버에서 받은 작업도 같은 규칙으로 합친다. 같은 ID의 다른 내용은 무시한다. */
export function 작업합치기(기존: readonly 진행작업[], 받은: readonly 진행작업[]): 진행작업[] {
  const 결과 = new Map(기존.filter(올바른작업).map((작업) => [작업.id, 작업]));
  for (const 작업 of 받은) {
    if (올바른작업(작업) && !결과.has(작업.id)) { 결과.set(작업.id, 작업); }
  }
  return [...결과.values()];
}

function 같은저장작업(원문: string, 짧은원문: string): boolean {
  try {
    const 작업 = 작업복원(JSON.parse(원문));
    return !!작업 && JSON.stringify(작업압축(작업)) === 짧은원문;
  } catch (_) { return false; }
}

export function 진행작업읽기(저장소: 저장소 | undefined = 브라우저저장소()): 진행작업[] {
  if (!저장소) { return []; }
  const 발견: { 키: string; 접두사: string; 작업: 진행작업; 짧은원문?: string }[] = [];
  try {
    const 키들 = Array.from({ length: 저장소.length }, (_, 번호) => 저장소.key(번호));
    for (const 키 of 키들) {
      if (!키 || !진행기록키인가(키)) { continue; }
      try {
        const 원문 = 저장소.getItem(키);
        if (!원문) { continue; }
        const 값: unknown = JSON.parse(원문);
        const 작업 = 작업복원(값);
        const 접두사 = STORAGE_PREFIXES.find((후보) => 키.startsWith(후보));
        if (!작업 || !접두사 || 키 !== 접두사 + 작업.id) { continue; }
        const 짧은작업 = 작업압축(작업);
        const 짧은원문 = 짧은작업 && JSON.stringify(짧은작업);
        발견.push({ 키, 접두사, 작업, 짧은원문 });
        if (짧은원문 && 짧은원문 !== 원문) {
          try { 저장소.setItem(키, 짧은원문); }
          catch (_) { /* 압축 갱신에 실패해도 기존 기록은 읽는다. */ }
        }
      } catch (_) { /* 한 항목이 손상되어도 나머지 기록은 읽는다. */ }
    }
  } catch (_) { /* 저장소 접근이 막힌 경우 이미 읽은 작업만 사용한다. */ }
  const 결과 = new Map<string, 진행작업>();
  const 우선순위 = new Map<string, number>();
  for (const 항목 of 발견) {
    const 순위 = STORAGE_PREFIXES.indexOf(항목.접두사);
    if (순위 < (우선순위.get(항목.작업.id) ?? Infinity)) {
      결과.set(항목.작업.id, 항목.작업);
      우선순위.set(항목.작업.id, 순위);
    }
  }
  for (const 항목 of 발견.sort((a, b) => STORAGE_PREFIXES.indexOf(a.접두사) -
    STORAGE_PREFIXES.indexOf(b.접두사))) {
    if (항목.접두사 === STORAGE_PREFIX || !항목.짧은원문) { continue; }
    try {
      const 새키 = STORAGE_PREFIX + 항목.작업.id;
      const 기존 = 저장소.getItem(새키);
      if (기존) {
        if (같은저장작업(기존, 항목.짧은원문)) { 저장소.removeItem(항목.키); }
      } else {
        저장소.setItem(새키, 항목.짧은원문);
        저장소.removeItem(항목.키);
      }
    } catch (_) { /* 새 키에 쓰지 못하면 기존 기록을 그대로 둔다. */ }
  }
  return [...결과.values()];
}

export function 진행작업저장(작업: 진행작업, 저장소: 저장소 | undefined = 브라우저저장소()): boolean {
  if (!저장소 || !올바른작업(작업)) { return false; }
  const 압축 = 작업압축(작업);
  if (!압축) { return false; }
  const 원문 = JSON.stringify(압축);
  try {
    const 키 = STORAGE_PREFIX + 작업.id;
    const 기존 = 저장소.getItem(키);
    if (기존) {
      if (기존 === 원문) { return true; }
      if (!같은저장작업(기존, 원문)) { return false; }
    } else {
      for (const 접두사 of LEGACY_STORAGE_PREFIXES) {
        const 이전키 = 접두사 + 작업.id;
        const 이전 = 저장소.getItem(이전키);
        if (!이전) { continue; }
        if (!같은저장작업(이전, 원문)) { return false; }
        try { 저장소.setItem(키, 원문); 저장소.removeItem(이전키); }
        catch (_) { return true; /* 이전 키에 같은 기록이 남아 있다. */ }
        return true;
      }
    }
    저장소.setItem(키, 원문);
    return true;
  } catch (_) { return false; }
}

export function 시도시작(passageId: string, day: string, contentVersion: string,
  continuedFrom?: 이어쓰기원본): Extract<진행작업, { type: 'started' }> {
  ID확인(passageId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) { throw new Error('날짜 형식은 YYYY-MM-DD여야 합니다.'); }
  if (continuedFrom) { ID확인(continuedFrom.attemptId); }
  return { schema: 2, id: 새ID(), attemptId: 새ID(), type: 'started',
    passageId, day, contentVersion, ...(continuedFrom && { continuedFrom }), at: new Date().toISOString() };
}

export function 입력묶음(attemptId: string, seq: number, keys: 입력키[], elapsedMs: number): Extract<진행작업, { type: 'inputs' }> {
  ID확인(attemptId);
  return { schema: 2, id: 새ID(), attemptId, type: 'inputs', seq,
    keys: keys.map((키) => ({ ...키 })), elapsedMs, at: new Date().toISOString() };
}

export function 시도완료(attemptId: string, elapsedMs: number, totalInputs: number, correctInputs: number): Extract<진행작업, { type: 'completed' }> {
  ID확인(attemptId);
  return { schema: 2, id: 새ID(), attemptId, type: 'completed',
    elapsedMs, totalInputs, correctInputs, at: new Date().toISOString() };
}

export function 시도중단(attemptId: string): Extract<진행작업, { type: 'abandoned' }> {
  ID확인(attemptId);
  return { schema: 2, id: 새ID(), attemptId, type: 'abandoned', at: new Date().toISOString() };
}

export function 시도목록(작업들: readonly 진행작업[]): 필사시도[] {
  const 모음 = new Map<string, 진행작업[]>();
  for (const 작업 of 작업들) {
    if (!올바른작업(작업)) { continue; }
    const 기존 = 모음.get(작업.attemptId) ?? [];
    기존.push(작업);
    모음.set(작업.attemptId, 기존);
  }
  const 원본들 = new Map<string, 필사시도>();
  for (const 작업묶음 of 모음.values()) {
    const 시작 = 작업묶음.find((작업): 작업 is Extract<진행작업, { type: 'started' }> => 작업.type === 'started');
    if (!시작) { continue; }
    const 입력작업 = 작업묶음.filter((작업): 작업 is Extract<진행작업, { type: 'inputs' }> => 작업.type === 'inputs')
      .sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id));
    const 입력들: 입력키[] = [];
    let 다음순서 = 0;
    let 걸린밀리초 = 0;
    let 마지막시각 = 시작.at;
    for (const 작업 of 입력작업) {
      if (작업.seq < 다음순서) { continue; }
      if (작업.seq !== 다음순서) { break; }
      입력들.push(...작업.keys);
      다음순서++;
      걸린밀리초 = 작업.elapsedMs;
      마지막시각 = 작업.at;
    }
    const 완료 = 작업묶음.filter((작업): 작업 is Extract<진행작업, { type: 'completed' }> => 작업.type === 'completed')
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    마지막시각 = 작업묶음.reduce((시각, 작업) => 작업.at > 시각 ? 작업.at : 시각, 마지막시각);
    원본들.set(시작.attemptId, { 시작, 입력들, 다음순서, 걸린밀리초, 마지막시각, 완료,
      중단됨: 작업묶음.some((작업) => 작업.type === 'abandoned'),
      복원가능: 입력작업.every((작업) => 작업.seq < 다음순서) });
  }
  const 결과 = new Map<string, 필사시도>();
  const 순환검사 = new Set<string>();
  function 복원(id: string): 필사시도 | undefined {
    if (결과.has(id)) { return 결과.get(id); }
    const 시도 = 원본들.get(id);
    if (!시도 || 순환검사.has(id)) { return undefined; }
    순환검사.add(id);
    const 원본 = 시도.시작.continuedFrom;
    if (원본) {
      const 부모 = 복원(원본.attemptId);
      if (!부모 || !부모.복원가능 || 부모.시작.passageId !== 시도.시작.passageId ||
          부모.시작.contentVersion !== 시도.시작.contentVersion ||
          부모.입력들.length < 원본.inputCount) {
        시도.복원가능 = false;
      } else {
        시도.입력들 = [...부모.입력들.slice(0, 원본.inputCount), ...시도.입력들];
        if (시도.다음순서 === 0) { 시도.걸린밀리초 = 원본.elapsedMs; }
      }
    }
    순환검사.delete(id);
    결과.set(id, 시도);
    return 시도;
  }
  for (const id of 원본들.keys()) { 복원(id); }
  return [...결과.values()];
}
