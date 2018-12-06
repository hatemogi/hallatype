import { decompose, packs } from '@/hangul';

describe('한글', () => {
  it('초중종성 분리', () => {
    const 분리 = (글자: string) => decompose(글자.charCodeAt(0));
    expect(분리('가')).toEqual([0, 0, 0]);
    expect(분리('김')).toEqual([0, 20, 16]);
    expect(분리('한')).toEqual([18, 0, 4]);
    expect(분리('슬')).toEqual([9, 18, 8]);
  });
  it('벌찾기', () => {
    const 벌식 = (글자: string) => packs(decompose(글자.charCodeAt(0)));
    expect(벌식('가')).toEqual([0, 0, 0]);
    expect(벌식('김')).toEqual([5, 2, 1]);
  });
});
