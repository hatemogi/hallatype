/**
 * 한글 두벌식 오토마타 구현
 */

enum 상태 {
    S0, // 시작상태
    S1, // 초성 단자음
    S2, // 초성 복자음
    S3, // 중성 기본모음 (두벌식 키 하나로 입력하는 모음)
    S4, // 중성 조합모음 (두벌식 키 두번 눌러서 입력하는 모음)
    S5, // 종성 단일자음 (쌍자음 포함 한 키로 입력하는 자음)
    S6, // 종성 조합자음 (자음 키 두 번 눌러서 입력하는 받침)
}

enum 이동 {
    이전,
    유지,
    다음,
}

export class 입력머신 {
    public readonly 조립글자: number[] = [];
    public readonly 완성글자: number[] = [];
    private readonly state = 상태.S0;
    public 입력(code: number): 이동 {
        return 이동.유지;
    }
}
