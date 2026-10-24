import { 테마별지문들 } from '@/practice-passages';
import { 최근완료기록들, 완료시각표시, 지문찾기 } from '@/practice-recent';
import { 본문버전, 시도시작, 시도완료, type 필사시도 } from '@/practice-progress';

const 지문 = 테마별지문들.시작하기[0];

function 완료시도(완료시각: string, 정타수: number, id = 지문.id,
  버전 = 본문버전(지문.본문)): 필사시도 {
  const 시작 = 시도시작(id, '2026-10-24', 버전);
  const 완료 = { ...시도완료(시작.attemptId, 29000, 100, 정타수), at: 완료시각 };
  return {
    시작,
    완료,
    입력들: [{ code: 'KeyR', shift: false, elapsedMs: 200 }],
    다음순서: 1,
    걸린밀리초: 29000,
    마지막시각: 완료시각,
    중단됨: false,
    복원가능: true,
  };
}

describe('최근 완료 기록', () => {
  it('완료 시각을 브라우저 현지 날짜와 분 단위로 표시한다', () => {
    const 완료시각 = new Date(2026, 9, 26, 18, 29).toISOString();
    expect(완료시각표시(완료시각)).toBe('2026/10/26 18:29');
    expect(최근완료기록들([완료시도(완료시각, 99)])[0].완료일시)
      .toBe('2026/10/26 18:29');
  });

  it('기본 목록에는 최근 완료 10건까지 보여준다', () => {
    const 시도들 = Array.from({ length: 12 }, (_, 순서) =>
      완료시도(`2026-10-24T${String(순서).padStart(2, '0')}:00:00.000Z`, 90 + 순서));
    const 기록 = 최근완료기록들(시도들);
    expect(기록).toHaveLength(10);
    expect(기록[0].완료시각).toBe('2026-10-24T11:00:00.000Z');
    expect(기록[9].완료시각).toBe('2026-10-24T02:00:00.000Z');
  });

  it('완료 시각 순으로 최근 건수를 고르고 같은 지문의 반복 완료도 보존한다', () => {
    const 오래된 = 완료시도('2026-10-21T10:00:00.000Z', 92);
    const 최신 = 완료시도('2026-10-24T10:00:00.000Z', 99);
    const 중간 = 완료시도('2026-10-23T10:00:00.000Z', 96);
    const 기록 = 최근완료기록들([오래된, 최신, 중간], 2);
    expect(기록.map((항목) => 항목.시도ID)).toEqual([
      최신.시작.attemptId, 중간.시작.attemptId,
    ]);
    expect(기록.map((항목) => 항목.정타율)).toEqual(['99.00', '96.00']);
    expect(기록[0].걸린시간).toBe('0분 29초');
    expect(기록[0].리듬막대들).toHaveLength(100);
    expect(기록[0].테마).toBe('시작하기');
    expect(기록[0].지문.id).toBe(지문.id);
  });

  it('현재 없는 지문과 본문이 바뀐 기록은 재입력 링크와 그래프에서 제외한다', () => {
    const 유효 = 완료시도('2026-10-24T10:00:00.000Z', 99);
    const 삭제 = 완료시도('2026-10-24T11:00:00.000Z', 99, 'AaBbCcDdEeFf');
    const 변경 = 완료시도('2026-10-24T12:00:00.000Z', 99, 지문.id, 'old');
    expect(최근완료기록들([삭제, 변경, 유효]).map((항목) => 항목.시도ID))
      .toEqual([유효.시작.attemptId]);
    expect(지문찾기(지문.id)?.지문.제목).toBe(지문.제목);
    expect(지문찾기('AaBbCcDdEeFf')).toBeUndefined();
  });
});
