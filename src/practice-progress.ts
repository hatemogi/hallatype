import { customAlphabet } from 'nanoid';

const STORAGE_PREFIX = 'hallatype:progress:v1:op:';
const 새ID = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);
const ID_PATTERN = /^[A-Za-z]{12}$/;
const 버전캐시 = new Map<string, string>();

function ID확인(id: string): void {
  if (!ID_PATTERN.test(id)) { throw new Error('ID는 영문자 12자리여야 합니다.'); }
}

export type 입력키 = { code: string; shift: boolean };
export type 이어쓰기원본 = { attemptId: string; inputCount: number; elapsedMs: number };

type 작업기본 = { id: string; attemptId: string; schema: 1; at: string };
export type 진행작업 =
  | (작업기본 & { type: 'started'; passageId: string; part: 1 | 2; contentVersion: string;
      continuedFrom?: 이어쓰기원본 })
  | (작업기본 & { type: 'inputs'; seq: number; keys: 입력키[]; elapsedMs: number })
  | (작업기본 & { type: 'completed'; elapsedMs: number; totalInputs: number; correctInputs: number })
  | (작업기본 & { type: 'abandoned' });

export type 저장소 = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem'>;

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

export function 브라우저저장소(): 저장소 | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch (_) { return undefined; }
}

/** 편 본문이 달라지면 기존 입력을 다른 내용에 재생하지 않는다. */
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
  if (작업.schema !== 1 || typeof 작업.id !== 'string' || !ID_PATTERN.test(작업.id) ||
      typeof 작업.attemptId !== 'string' || !ID_PATTERN.test(작업.attemptId) ||
      typeof 작업.at !== 'string') { return false; }
  switch (작업.type) {
    case 'started':
      return typeof 작업.passageId === 'string' && ID_PATTERN.test(작업.passageId) &&
        (작업.part === 1 || 작업.part === 2) &&
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
          typeof (키 as 입력키).code === 'string' && typeof (키 as 입력키).shift === 'boolean');
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

export function 진행작업읽기(저장소: 저장소 | undefined = 브라우저저장소()): 진행작업[] {
  if (!저장소) { return []; }
  const 결과: 진행작업[] = [];
  try {
    for (let 번호 = 0; 번호 < 저장소.length; 번호++) {
      const 키 = 저장소.key(번호);
      if (!키?.startsWith(STORAGE_PREFIX)) { continue; }
      try {
        const 원문 = 저장소.getItem(키);
        if (!원문) { continue; }
        const 값: unknown = JSON.parse(원문);
        if (올바른작업(값) && 키 === STORAGE_PREFIX + 값.id) { 결과.push(값); }
      } catch (_) { /* 한 항목이 손상되어도 나머지 기록은 읽는다. */ }
    }
  } catch (_) { /* 저장소 접근이 막힌 경우 이미 읽은 작업만 사용한다. */ }
  return 결과;
}

export function 진행작업저장(작업: 진행작업, 저장소: 저장소 | undefined = 브라우저저장소()): boolean {
  if (!저장소 || !올바른작업(작업)) { return false; }
  try {
    const 키 = STORAGE_PREFIX + 작업.id;
    const 기존 = 저장소.getItem(키);
    if (기존) { return 기존 === JSON.stringify(작업); }
    저장소.setItem(키, JSON.stringify(작업));
    return true;
  } catch (_) { return false; }
}

export function 시도시작(passageId: string, part: 1 | 2, contentVersion: string,
  continuedFrom?: 이어쓰기원본): Extract<진행작업, { type: 'started' }> {
  ID확인(passageId);
  if (continuedFrom) { ID확인(continuedFrom.attemptId); }
  return { schema: 1, id: 새ID(), attemptId: 새ID(), type: 'started',
    passageId, part, contentVersion, ...(continuedFrom && { continuedFrom }), at: new Date().toISOString() };
}

export function 입력묶음(attemptId: string, seq: number, keys: 입력키[], elapsedMs: number): Extract<진행작업, { type: 'inputs' }> {
  ID확인(attemptId);
  return { schema: 1, id: 새ID(), attemptId, type: 'inputs', seq,
    keys: keys.map((키) => ({ ...키 })), elapsedMs, at: new Date().toISOString() };
}

export function 시도완료(attemptId: string, elapsedMs: number, totalInputs: number, correctInputs: number): Extract<진행작업, { type: 'completed' }> {
  ID확인(attemptId);
  return { schema: 1, id: 새ID(), attemptId, type: 'completed',
    elapsedMs, totalInputs, correctInputs, at: new Date().toISOString() };
}

export function 시도중단(attemptId: string): Extract<진행작업, { type: 'abandoned' }> {
  ID확인(attemptId);
  return { schema: 1, id: 새ID(), attemptId, type: 'abandoned', at: new Date().toISOString() };
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
          부모.시작.part !== 시도.시작.part || 부모.시작.contentVersion !== 시도.시작.contentVersion ||
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
