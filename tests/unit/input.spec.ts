import { 입력머신, 위치이동 } from '@/input';
import { 글자종류 } from '@/charactor';

describe('오토마타', () => {
    it('기본입력', () => {
        const 머신 = new 입력머신();
        const [이동, 완성, 조립] = 머신.입력(false, 'a');
        expect(이동).toEqual(위치이동.유지);
    });
});
