import { 정식사이트인가 } from '@/practice-release';
import { 기본필사설정, 필사설정읽기, 필사테마순서, 공개필사테마들,
  준비중필사테마들, 사용가능필사테마들 } from '@/practice-settings';

it('접속 주소가 dailytyping.com일 때만 정식 사이트로 본다', () => {
  expect(정식사이트인가('https://dailytyping.com')).toBe(true);
  expect(정식사이트인가('http://dailytyping.com')).toBe(false);
  expect(정식사이트인가('https://dailytyping.com:8080')).toBe(false);
  expect(정식사이트인가('https://dev.dailytyping.com')).toBe(false);
  expect(정식사이트인가('http://127.0.0.1')).toBe(false);
});

it('정식 사이트는 공개 테마만 사용하고 개발 주소는 준비 중 테마도 쓴다', () => {
  expect(공개필사테마들).toEqual(필사테마순서.slice(0, 13));
  expect(준비중필사테마들).toEqual(필사테마순서.slice(13));
  expect(사용가능필사테마들('https://dailytyping.com')).toEqual(공개필사테마들);
  expect(사용가능필사테마들('https://dev.dailytyping.com')).toEqual(필사테마순서);
  expect(사용가능필사테마들('http://127.0.0.1')).toEqual(필사테마순서);
  const storage = { getItem: () => JSON.stringify({ 테마: 준비중필사테마들[0], 설정버전: 2 }) };
  expect(필사설정읽기(storage, 'https://dailytyping.com').테마).toBe(기본필사설정.테마);
  expect(필사설정읽기(storage, 'https://dev.dailytyping.com').테마).toBe(준비중필사테마들[0]);
});
