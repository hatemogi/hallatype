import { 글자틀, 글자위치, 글자없음 } from '@/글자';
import { 섹션나누기, 지문틀 } from '@/본문';

describe('문서', () => {
    it('섹션 분리', () => {
        const 문서 = '가 나\n다 라\n마 바 사 아 자 차 카\n타파하';
        const sections = 섹션나누기(문서, 1);
        expect(sections.length).toEqual(4);
        const medium = 섹션나누기(문서, 3);
        expect(medium.length).toEqual(3);
        const long = 섹션나누기(문서, 5);
        expect(long.length).toEqual(1);
    });

    it('지문쓰기', () => {
        const 지문 = new 지문틀(10);
        const 위치 = new 글자위치(0, 0);
        지문.쓰기('안녕하세요?');
        expect(지문.글자(위치)).toEqual(글자틀.생성('안'.codePointAt(0)!));
        expect(지문.글자(위치.다음)).toEqual(글자없음);
    });
});
