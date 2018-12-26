import { 입력머신 } from '@/input';

describe('오토마타', () => {
    it('기본입력', () => {
        const 머신 = new 입력머신();
        expect(머신.조립글자).toEqual([]);
        expect(머신.완성글자).toEqual([]);
    });
});
