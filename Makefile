.DEFAULT_GOAL := help

.PHONY: help install run dev typecheck test build build-pages deploy invalidate preview check

help:
	@echo "사용 가능한 명령:"
	@echo "  make install    의존성 설치"
	@echo "  make run        웹 편집기 실행 (http://127.0.0.1:8081/)"
	@echo "  make dev        개발 서버 실행 (make run과 동일)"
	@echo "  make typecheck  타입 검사"
	@echo "  make test       단위 테스트"
	@echo "  make build      프로덕션 빌드"
	@echo "  make build-pages  타자 연습만 docs/에 GitHub Pages용으로 빌드"
	@echo "  make deploy     전체 앱을 빌드해 dailytyping.com S3 버킷에 업로드"
	@echo "  make invalidate  CloudFront 전체 캐시 무효화 요청"
	@echo "  make preview    빌드 결과 미리보기"
	@echo "  make check      테스트와 빌드 검증"

install:
	npm ci

run:
	npm run dev -- --host 127.0.0.1 --port 8081 --strictPort

dev: run

typecheck:
	npm run typecheck

test:
	npm test

build:
	npm run build

build-pages:
	npm run build:pages

deploy: build
	aws s3 sync dist/ s3://dailytyping.com/ --profile dailytyping --region ap-northeast-2

invalidate:
	aws cloudfront create-invalidation --distribution-id ESGYQVMNB8DF9 --paths '/*' --profile dailytyping --no-cli-pager

preview:
	npm run preview

check: test build
