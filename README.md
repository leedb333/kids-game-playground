# 어린이 게임 놀이터

**벽돌깨기**와 **반짝반짝 짝꿍 카드**를 고를 수 있는 어린이용 게임 놀이터입니다. 진행 기록과 소리 설정은 이 기기의 브라우저에 저장합니다.

- [운영 놀이터](https://leedb333.github.io/kids-game-playground/)
- [달콤한 요리놀이터](https://leedb333.github.io/kids-cooking-studio/)
- [알록달록 색칠놀이터](https://leedb333.github.io/kids-coloring-studio/)

예전 요리 2.0 주소에는 독립 요리놀이터로 연결하는 안내 페이지가 있습니다. 각각의 운영 경로에서 기존 기록은 처음 저장한 브라우저 프로필로 다시 열 수 있습니다.

## 개발과 검증

Node.js 24와 pnpm을 사용합니다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
pnpm build
node scripts/verify-dist.mjs
pnpm exec playwright install chromium
pnpm test
```

Vite와 Pages 경로는 `/kids-game-playground/`입니다. 게임 진입점을 추가하려면 `src/games/registry.ts`에 이름, 카드 정보와 지연 로딩 진입점을 등록합니다. 기존 기록과의 호환이 필요한 경우 저장 키, 데이터 형식과 게임 ID를 유지합니다.

두 게임과 홈은 처음 온라인 방문에서 사전 캐시가 준비된 뒤 오프라인에서도 열립니다. 설치 앱 업데이트는 새 파일을 받은 뒤 열린 기존 놀이터 탭이 닫히면 적용됩니다. 캐시 갱신은 종합 놀이터의 등록 범위에 한정합니다.

## 검수와 이력

- [벽돌깨기 개발 기록](docs/brick-breaker/README.md)
- [기억력 카드 개발 기록](docs/memory-card/README.md)
- [종합 놀이터 정리 검수](docs/two-games-review/README.md)
- [기존 색칠놀이 개발 기록](docs/coloring-v4-final/README.md)
- [기존 요리놀이 개발 기록](docs/cooking-v2-complete/REVIEW.md)
- [기존 자료의 소스와 운영 기준 커밋](https://github.com/leedb333/kids-game-playground/tree/d608a79becc6ea9731c7ddf72ef8671fe25eb92e)

GitHub Pages는 승인 후 `main`의 수동 배포 워크플로를 실행합니다.
