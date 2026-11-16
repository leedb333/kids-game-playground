# 컵케이크 세 개 제작 — main 통합 검토

## 통합 기준

2026-11-16 확인한 최신 main은 `ac38e429da043a7510ab17875240ff44a399911e`입니다. 여기서 `release/cooking-v2-cupcake-three`를 새로 만들고, PR #31 최종 head `6f6e0f5614948bb9678c03e51ee10fafab80bdbc`의 운영 파일만 선별했습니다. 개발 브랜치 전체 병합이나 실험 커밋의 일괄 cherry-pick을 하지 않았습니다. PR #31의 기존 GitHub 검사(Build and review, run 39)는 success였습니다. 이것을 이번 통합 브랜치의 검사 결과로 대신하지 않습니다.

| 기존 PR | 기준 → 작업 브랜치 | 이번에 가져온 부분 |
|---|---|---|
| #27 | main → assets/cupcake-three-reviewed | 승인 재료 카드 4종 |
| #28 | #27 → assets/cupcake-three-recheck | 빈 3구 트레이 |
| #29 | #28 → experiment/cupcake-existing-assets | 독립 실험 파일은 제외. #31에 반영된 조작·합성 방식만 운영 코드로 포함 |
| #30 | #29 → assets/cupcake-precision-shells | 컵 앞/뒤·빈 볼, 실제 사용하는 합성 좌표 |
| #31 | #30 → feat/cooking-v2-cupcake-three | 세 컵 제작 코드·필요한 검사·캐시 수정 |

다섯 PR은 모두 open/Draft/미병합으로 확인했고 그대로 보존했습니다. 이번 PR의 **base는 main**입니다. 이 통합 PR이 승인되면 #27~#31을 먼저 따로 병합할 필요가 없습니다.

## 포함 기능과 경로

재료 넣기·원형 섞기 → 세 컵 각각 채우기 → 트레이 이동·동시 굽기 → 각각 크림/장식 → 함께 완성·1400² 투명 PNG. 컵별 독립 저장·되돌리기, 이전 기록 보관/꾸미기 가져오기, 확인 후 초기화를 유지합니다.

- 새 게임: `/kids-game-playground/prototypes/cooking-v2/cupcake/`
- 이전 한 컵 기록 확인: 같은 경로의 `#legacy-play`
- 새 저장 키: `kids-game-playground:v1:game:cooking-v2:cupcake:three:r2`
- 이전 r1 키, 피자·햄버거 및 다른 게임 키·경로는 보존합니다. 통합 홈의 기존 요리놀이 연결도 그대로입니다.

## 이미지 8종

모두 `public/assets/cooking-v2/cupcake/three/`에 있으며 PNG color type 6(RGBA)입니다. 각 파일을 PR #31의 Git 원본과 바이트 단위로 비교해 일치함을 확인했습니다. 원본 이미지 재생성·재가공은 하지 않았습니다.

| 파일 | 크기 | SHA-256 앞 12자리 |
|---|---|---|
| ingredient-egg.png | 1024×1024 | ebc9af731c0f |
| ingredient-milk.png | 1024×1024 | 788a2458c36a |
| ingredient-flour.png | 1024×1024 | 86df4246d213 |
| ingredient-sugar.png | 1024×1024 | ba3abef7b029 |
| cupcake-tray-3-base.png | 1800×1000 | daa4ad0f1739 |
| cup-wrapper-front.png | 1254×1254 | bf1a870d4fe8 |
| cup-wrapper-back-inside.png | 1254×1254 | c412465bc124 |
| mixing-bowl-empty.png | 1254×1254 | a277d5b6ac0f |

## 의존성 정리와 파일 범위

- `src/games/cooking-v2/cupcake/`: 진입 파일, 이전 화면 보존 파일, 기존 오븐의 선택적 트레이 인자, `three/`의 화면·모델·합성·스타일을 포함합니다.
- **합성 좌표를 문서에서 분리했습니다.** #31의 `graphics.ts`는 `docs/cupcake-precision/composition.json`을 실제로 import했습니다. 운영에 필요한 `cup.contentClip`과 `tray`만 `three/composition.json`으로 옮겼습니다. 기존 좌표와 깊은 비교로 일치함을 확인했습니다. 검수 문서나 복원 후보 파일은 런타임에 필요하지 않습니다.
- 기존 `Cupcake.tsx`, `model.ts`, `assets.ts`, 음식 가공본, `full/useSavedRecipe.ts`, 햄버거의 기존 접시 이미지는 main에 이미 있습니다. 수정하지 않고 재사용합니다.
- `vite.config.ts`: #31의 캐시 생성 post 순서·중복 제거를 유지합니다. 실제 최종 파일만 캐시하게 하는 수정이며 Pages base·빌드 진입점·캐시 정책·배포 workflow는 변경하지 않습니다.
- `tests/cupcake-three.spec.ts`: 좌표 파일 경로를 새 운영 위치로 변경했습니다. 캡처·PNG·수치 출력은 Git에서 제외되는 `playwright-report/cupcake-release/`로 옮겼습니다.
- `tests/cupcake.spec.ts`·`cupcake-polish.spec.ts`: 기존 검사에서 이전 기록 확인 경로를 유지하기 위한 #31 수정만 포함합니다. 이번 제한 검사에서 이 두 파일 전체를 실행하지 않습니다.
- `tests/cupcake-release-smoke.spec.ts`·`cupcake-release.config.ts`: 유지 대상 게임 핵심 기능과 공통 캐시만 검사합니다. 한 번에 작업자 하나로 실행합니다.
- `package.json`: `test:cupcake-release` 실행 항목만 추가합니다. 라이브러리·lockfile 변경은 없습니다.
- `.github/workflows/check.yml`: 이 release 브랜치의 PR에서만 제한 검사를 실행합니다. 다른 브랜치의 기존 검사 방식은 유지합니다. 검수 산출물은 Actions artifact로 제공하고 Git에는 넣지 않습니다.

다음 **신규 개발 자료를 통합하지 않았습니다**: `experiments/cupcake-reuse/`, `scripts/prepare-cupcake-precision.mjs`, `scripts/recheck-cupcake-assets.mjs`, `scripts/review-cupcake-assets.mjs`, `docs/cupcake-three-assets/`, `docs/cupcake-three-recheck/`, `docs/cupcake-reuse-lab/`, `docs/cupcake-precision/`, `docs/cupcake-three-game/`. 복원 후보·중간 상태 PNG·대량 캡처·실행 로그도 포함하지 않습니다. main에 원래 있던 다른 문서나 게임은 삭제하지 않았습니다.

## 이번에 실행하는 검사

```text
pnpm build
node scripts/verify-dist.mjs
pnpm test:cupcake-release --reporter=line
```

- 세 컵 기능 15개: 실제 터치 조리 전체, 저장/이어하기·이전 데이터, 개별 꾸미기·되돌리기, 굽기, 실제 PNG 다운로드/화면 픽셀 비교, 태블릿/휴대폰 크기, 컵/볼 보호 영역, 캐시 파일 검사.
- 핵심 확인 7개: 색칠 한 영역 터치·되돌리기, 벽돌 공 발사·일시정지, 기억력 카드 짝 맞추기, 피자 토핑·이어하기, 햄버거 패티/소스·이어하기, 유지 게임의 새 오프라인 진입, 이전 한 컵 기록의 크림 조작.
- 구버전 요리놀이·코디놀이와 기존 전체 254개 회귀는 이번에 실행하지 않습니다. 과거 통과 수를 이번 통과 수로 보고하지 않습니다.
- 실제 삼성 기기 검사는 미수행입니다. 기존의 작은 질감 투입과 내용물 교차 전환 표현 한계도 유지됩니다.

로컬 결과: 타입 검사·운영 빌드·Pages 경로 통과. 세 컵 15개와 핵심 확인 7개, 총 22개 항목을 검증했습니다. 최초 21개 실행에서 20개가 통과했고 피자 검사 1개는 검사 대상의 속성명을 잘못 지정해 실패했습니다. 기존 피자 코드는 수정하지 않고 `data-stage` 대신 실제 화면의 `data-step`을 확인하도록 고쳐 재통과했습니다. 추가한 이전 한 컵 기록 검사도 통과했습니다. 한 번의 22개 일괄 통과 결과로 바꾸지 않고 이 재검사 과정을 구분합니다. 통합 PR의 GitHub 자동검사는 같은 제한 구성의 22개를 새로 실행합니다.

컵 앞면 9상태·볼 보호 영역 4상태의 픽셀 차이 0, 실제 1400² 투명 PNG 다운로드와 화면의 픽셀 차이 0을 재확인했습니다. 캐시 목록은 실제 존재하는 113개이며 중복이 없습니다. 이미지 8종과 운영 좌표도 PR #31과 일치합니다. 기존 전체 254개·구버전 요리놀이·코디놀이는 실행하지 않았습니다. 이전 한 컵 전체 22개 검사 역시 이번에 반복하지 않고 기록 보기의 핵심 조작만 확인했습니다.

GitHub 자동검사 상태는 통합 PR과 완료 보고에 별도로 기록합니다. 이전 PR의 상세 캡처·검수 기록은 해당 PR 브랜치에 남아 있습니다. 실제 삼성 기기 플레이는 병합 전 사용자 최종 확인이 필요합니다.

## 사용자가 검토 후 진행할 순서

1. 새 통합 Draft PR의 base가 main인지, Files changed에 운영 코드·8종 이미지·필수 검사 외 실험 파일이 없는지 확인합니다.
2. Checks가 초록색인지 확인합니다. Actions의 `cupcake-release-checks` artifact에서 실제 제작 화면과 다운로드 PNG를 확인할 수 있습니다.
3. 실제 갤럭시탭에서 최종 확인 후 Ready for review로 바꾸고, 이 최종 통합 PR을 main에 병합합니다. 이번 작업에서는 수행하지 않습니다.
4. 배포를 원할 때만 Actions → `Publish to GitHub Pages (manual)` → Run workflow → main을 선택합니다. 이번 작업에서는 실행하지 않습니다.
5. 예상 게임 주소: `https://leedb333.github.io/kids-game-playground/prototypes/cooking-v2/cupcake/`. 통합 홈 주소와 다른 게임 경로는 그대로입니다.
