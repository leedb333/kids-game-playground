# 어린이 게임 놀이터

1차 개발: 홈 화면, 공통 홈 이동, 소리 설정, 준비 중 카드만 구현합니다. 실제 게임은 포함하지 않습니다. 소리 버튼은 공통 음소거 설정을 저장하며 현재 화면에는 배경음이나 효과음이 없습니다.

## 실행

Node.js 24와 pnpm을 사용하는 독립 React + TypeScript + Vite 앱입니다.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

화면에 나오는 주소를 브라우저에서 여세요. 빌드는 `pnpm build`, 빌드 미리보기는 `pnpm preview`입니다. 기본 주소 경로는 `/kids-game-playground/`입니다.

## 파일 안내

- `src/games/registry.ts`: 게임 목록·순서·색상·실행 가능 상태
- `src/games/<게임이름>/`: 추후 각 게임의 독립 코드 위치
- `src/storage.ts`: 앱 공통 설정과 게임별 저장 공간. `kids-game-playground:v1:game:<id>` 키를 사용합니다.
- `src/Art.tsx`: 홈 화면 전용 SVG 그림. 확정 시안을 참고해 별도로 그린 그림이며 원본 이미지와 픽셀 단위로 같지는 않습니다.
- `src/main.tsx`: 공통 홈·소리 메뉴와 준비 중 버튼
- `public/`: 설치 아이콘과 PWA 정보
- `docs/screenshots/`: 검증 화면

게임을 추가할 때는 독립 폴더에 기본 내보내기 React 화면을 만들고 registry 항목을 `status:'ready', load:()=>import('./게임이름')`로 등록합니다. 각 게임은 `gameStorage(id)`를 사용합니다. 현재 모든 항목은 `coming-soon`으로 비활성화돼 있습니다. 게임 본체의 오류 처리와 진행 중 홈 이동 확인은 해당 게임 개발 단계에서 추가합니다.

## 오프라인·개인정보

외부 폰트·광고·로그인·결제·분석·추적 스크립트가 없습니다. 설정은 기기에만 저장합니다. 저장이 차단돼도 화면은 작동하고 설정은 현재 세션에만 적용됩니다.

프로덕션 빌드에서 서비스 워커가 홈과 정적 파일을 미리 저장합니다. 최초 온라인 접속 및 저장 완료 후 오프라인으로 다시 열 수 있습니다. 브라우저 데이터 삭제·저장 공간 정리 후에는 온라인 접속이 다시 필요합니다. 개발 서버에는 서비스 워커를 등록하지 않습니다. 업데이트는 새 서비스 워커의 저장 완료 후 기존 창을 모두 닫고 다시 열 때 적용됩니다.

## GitHub·배포

전용 저장소는 [leedb333/kids-game-playground](https://github.com/leedb333/kids-game-playground)입니다. 기존 `kids-color-by-number` 저장소와는 별개입니다. 작업 브랜치는 `feat/playground-home`을 사용합니다. 자동 병합·자동 배포는 없습니다. CI는 PR 빌드 결과만 보관합니다.

GitHub Pages 준비는 [다음 단계 안내](docs/GITHUB-SETUP.md)를 참고하세요. 저장소 이름이 다르면 `BASE_PATH`를 `/<새 저장소 이름>/`으로 지정해 빌드해야 합니다.

설정 근거: [Vite GitHub Pages 안내](https://vite.dev/guide/static-deploy), [MDN 서비스 워커 안내](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
