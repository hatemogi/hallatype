import { 한글 } from '@/charactor';
import { 상태코드, 머신상태, 상태전이, 입력머신, 위치이동 } from '@/input';
import { 글자종류 } from '@/charactor';

describe('오토마타', () => {
    it('상태.S0', () => {
        const 상태 = 상태코드;
        const 없음 = 한글.없음;
        const 한 = (초성: number, 중성: number, 종성: number) =>  new 한글(초성, 중성, 종성);
        const 전이 = 상태전이;
        const S0: 머신상태 = [상태.S0, 없음, 없음];
        expect(전이(S0, [false, 'KeyR'])).toEqual([위치이동.유지, 상태.S1, 없음, 한(1, 0, 0)]);
        expect(전이(S0, [true, 'KeyR'])).toEqual([위치이동.유지, 상태.S2, 없음, 한(2, 0, 0)]);
        expect(전이(S0, [false, 'KeyK'])).toEqual([위치이동.유지, 상태.S3, 없음, 한(0, 1, 0)]);
        expect(전이(S0, [false, 'Backspace'])).toEqual([위치이동.이전, 상태.S0, 없음, 없음]);
    });
    it('상태.S0', () => {
        const 상태 = 상태코드;
        const 없음 = 한글.없음;
        const 한 = (초성: number, 중성: number, 종성: number) =>  new 한글(초성, 중성, 종성);
        const 전이 = 상태전이;
        const S0: 머신상태 = [상태.S0, 없음, 없음];
        expect(전이(S0, [false, 'KeyR'])).toEqual([위치이동.유지, 상태.S1, 없음, 한(1, 0, 0)]);
        expect(전이(S0, [true, 'KeyR'])).toEqual([위치이동.유지, 상태.S2, 없음, 한(2, 0, 0)]);
        expect(전이(S0, [false, 'KeyK'])).toEqual([위치이동.유지, 상태.S3, 없음, 한(0, 1, 0)]);
        expect(전이(S0, [false, 'Backspace'])).toEqual([위치이동.이전, 상태.S0, 없음, 없음]);
    });

    it('입력머신', () => {
        const 머신 = new 입력머신();
        const [이동, 완성, 조립] = 머신.입력([false, 'a']);
        expect(이동).toEqual(위치이동.유지);
    });
});
