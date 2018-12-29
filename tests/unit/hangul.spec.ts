import { 분리, 벌식 } from '@/hangul';

describe('한글', () => {
  it('초중종성 분리', () => {
    const 분 = (글자: string) => 분리(글자.charCodeAt(0));
    expect(분('가')).toEqual([0, 0, 0]);
    expect(분('김')).toEqual([0, 20, 16]);
    expect(분('한')).toEqual([18, 0, 4]);
    expect(분('슬')).toEqual([9, 18, 8]);
  });
  it('벌찾기', () => {
    const 벌 = (글자: string) => 벌식(분리(글자.charCodeAt(0)));
    expect(벌('가')).toEqual([0, 0, 0]);
    expect(벌('김')).toEqual([5, 2, 1]);
  });
});
