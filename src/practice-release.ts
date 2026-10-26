/** 배포 방식과 관계없이 실제 접속 주소로 공개 범위를 결정한다. */
export function 정식사이트인가(origin: string = typeof window === 'undefined' ? '' : window.location.origin): boolean {
  return origin === 'https://dailytyping.com';
}
