import { splitSections, 글자위치 } from '@/document';

describe('문서', () => {
    it('섹션 분리', () => {
        const 문서 = '가 나\n다 라\n마 바 사 아 자 차 카\n타파하';
        const sections = splitSections(문서, 1);
        expect(sections.length).toEqual(4);
        const medium = splitSections(문서, 3);
        expect(medium.length).toEqual(3);
        const long = splitSections(문서, 5);
        expect(long.length).toEqual(1);
    });

    it('글자위치이동', () => {
        const 위치 = new 글자위치(0, 0, 8);
        expect(위치.행).toEqual(0);
        expect(위치.열).toEqual(0);
        expect(위치.다음.행).toEqual(0);
        expect(위치.다음.열).toEqual(1);
    });
});
