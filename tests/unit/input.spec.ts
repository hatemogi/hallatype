import { 글자 } from '@/charactor';
import { 상태코드, 머신상태, 상태전이, 입력머신, 위치이동 } from '@/input';
import { 글자종류 } from '@/charactor';

describe('오토마타', () => {
    it('상태.S0', () => {
        const 한글 = (초: number, 중: number, 종: number) => new 글자(글자종류.한글, [초, 중, 종]);
        const S1 = 상태전이([상태코드.S0, 글자.없음, 글자.없음], [false, 'KeyR']);
        expect(S1).toEqual([상태코드.S1, 글자.없음, 한글(1, 0, 0)]);
    });
    it('입력머신', () => {
        const 머신 = new 입력머신();
        const [이동, 완성, 조립] = 머신.입력([false, 'a']);
        expect(이동).toEqual(위치이동.유지);
    });
});
