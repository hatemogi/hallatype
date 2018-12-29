import { 글자, 글자위치 } from '@/charactor';
import { splitSections, 지문 } from '@/document';

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

    it('지문쓰기', () => {
        const 바닥글 = new 지문(10);
        const 위치 = new 글자위치(0, 0);
        바닥글.쓰기('안녕하세요?');
        expect(바닥글.바닥글자(위치)).toEqual(글자.생성('안'.codePointAt(0)!));
        expect(바닥글.바닥글자(위치.다음)).toBeUndefined();
    });
});
