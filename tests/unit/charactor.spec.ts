import { 글자위치 } from '@/charactor';

describe('글자', () => {
    it('글자위치.다음', () => {
        const 위치 = new 글자위치(0, 0, 3);
        expect(위치.행).toEqual(0);
        expect(위치.열).toEqual(0);
        expect(위치.다음.행).toEqual(0);
        expect(위치.다음.열).toEqual(1);
        expect(위치.다음.다음.행).toEqual(0);
        expect(위치.다음.다음.열).toEqual(2);
        expect(위치.다음.다음.다음.열).toEqual(0);
        expect(위치.다음.다음.다음.행).toEqual(1);
    });

    it('글자위치.이전', () => {
        const 위치 = new 글자위치(1, 2, 3);
        expect(위치.행).toEqual(1);
        expect(위치.열).toEqual(2);
        expect(위치.이전().행).toEqual(1);
        expect(위치.이전().열).toEqual(1);
        const 첫열 = 위치.이전().이전();
        expect(첫열.행).toEqual(1);
        expect(첫열.열).toEqual(0);
        expect(첫열.이전().열).toEqual(2);
        expect(첫열.이전().행).toEqual(0);
        const 젤앞 = new 글자위치(0, 0);
        expect(젤앞.이전().행).toEqual(0);
        expect(젤앞.이전().열).toEqual(0);
    });
});
