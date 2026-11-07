# 어린이 게임 놀이터

홈 화면과 순서대로 색칠놀이, 요리놀이 4종(피자·스파게티·샌드위치·꼬치구이)과 봄 코디놀이를 제공합니다. 경찰차·소방차·숲속 공룡·꽃에 앉은 나비, 승인된 가로형 도안 4개를 사용합니다. 차량은 로봇 없이 각각 25색이며 장미와 공룡 알은 제외했습니다. 배경은 처음부터 색이 있는 고정 그림이고, 주제의 독립 SVG 영역만 순서대로 색칠합니다. 승인된 원화의 가로세로 비율을 유지합니다. 사계절 코디놀이는 봄 대표 버전을 제공하며, 여름·가을·겨울과 벽돌깨기는 준비 중입니다. 소리 버튼은 공통 음소거 설정을 저장하며, 요리놀이 오븐 완료음에 적용됩니다.

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

게임을 추가할 때는 독립 폴더에 기본 내보내기 React 화면을 만들고 registry 항목을 `status:'ready', load:()=>import('./게임이름')`로 등록합니다. 각 게임은 `gameStorage(id)` 또는 해당 게임 아래의 독립된 저장 모듈을 사용합니다. 색칠놀이·요리놀이·코디놀이는 ready이고 벽돌깨기는 coming-soon입니다. 공통 게임 불러오기 오류 안내를 제공하며, 색칠놀이는 매 터치마다 자동 저장합니다.

색칠놀이 코드와 도안은 `src/games/coloring/`, 구현 내용과 검증 캡처는 [색칠놀이 안내](docs/coloring-v4-final/README.md)에 있습니다. 개발 브랜치는 `feat/coloring-landscape`입니다.

## 오프라인·개인정보

외부 폰트·광고·로그인·결제·분석·추적 스크립트가 없습니다. 설정은 기기에만 저장합니다. 저장이 차단돼도 화면은 작동하고 설정은 현재 세션에만 적용됩니다.

프로덕션 빌드에서 서비스 워커가 홈과 정적 파일을 미리 저장합니다. 최초 온라인 접속 및 저장 완료 후 오프라인으로 다시 열 수 있습니다. 브라우저 데이터 삭제·저장 공간 정리 후에는 온라인 접속이 다시 필요합니다. 개발 서버에는 서비스 워커를 등록하지 않습니다. 업데이트는 새 서비스 워커의 저장 완료 후 기존 창을 모두 닫고 다시 열 때 적용됩니다.

## GitHub·배포

전용 저장소는 [leedb333/kids-game-playground](https://github.com/leedb333/kids-game-playground)입니다. 기존 `kids-color-by-number` 저장소와는 별개입니다. 작업 브랜치는 `feat/playground-home`을 사용합니다. 자동 병합·자동 배포는 없습니다. CI는 PR 빌드 결과만 보관합니다.

GitHub Pages 준비는 [다음 단계 안내](docs/GITHUB-SETUP.md)를 참고하세요. 저장소 이름이 다르면 `BASE_PATH`를 `/<새 저장소 이름>/`으로 지정해 빌드해야 합니다.

설정 근거: [Vite GitHub Pages 안내](https://vite.dev/guide/static-deploy), [MDN 서비스 워커 안내](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## 수동 배포 준비

홈 화면 PR #1은 병합됐습니다. 배포 준비는 `chore/pages-deployment`의 별도 PR에서 검토합니다. PR 빌드 검사와 수동 배포 작업은 분리되어 있습니다. 코드 업로드와 병합만으로는 배포되지 않습니다. 클릭 순서는 [배포 안내](docs/GITHUB-SETUP.md)를 참고하세요.

## 요리놀이

피자 만들기는 [요리놀이 안내](docs/cooking-touch/README.md)를 참고하세요. 요리 데이터·화면·저장 기능은 src/games/cooking/ 에 분리했습니다. 요리별 상태는 독립 키로 저장하며, 기존 색칠놀이 코드는 수정하지 않습니다.

스파게티·샌드위치·꼬치구이의 조작·구조·검증 캡처는 [추가 요리 3종 안내](docs/cooking-meals/README.md)를 참고하세요. 작업 브랜치는 `feat/cooking-three-recipes`입니다.

## 사계절 코디놀이

캐릭터 3명·봄 배경·대표 아이템 34개와 실제 드래그 착용, 자동 저장·되돌리기·기념사진 PNG 저장을 제공합니다. [봄 코디놀이 안내와 착용 검토 캡처](docs/dressup-spring/README.md)를 참고하세요. 다른 세 계절과 카테고리별 10~15개 의상 확장은 대표 디자인 검토 뒤에 진행합니다.

캐릭터·의상·측면 강아지와 기본복 숨김 구조를 개선한 내용은 [코디 착용 품질 개선 안내](docs/dressup-fitting/README.md)를 참고하세요. 이전 봄 코디 저장 내용은 새 슬롯으로 변환하여 이어갑니다.

강아지 전용 3개 탭과 4개 슬롯, 새 자세·옷 5종·저장 변환은 [강아지 코디 개선 안내](docs/dog-refinement/README.md)를 참고하세요.
