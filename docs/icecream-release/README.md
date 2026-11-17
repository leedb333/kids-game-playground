# 아이스크림 최종 통합 검수·배포 안내

## 기준과 포함 범위

- 최신 main: `d75d43c67a788e6ab8bcec3f4d91d5f6320de3c6` (컵케이크 PR #32 반영).
- 기능 기준: PR #36 `c95da48cb7ea054b0b995d7c848e15fe3d940ec3`.
- PR #33(에셋) → #34(스쿱) → #35(토핑·배치) → #36(완성·PNG)의 필요한 최종 파일만 선별했다. 기존 네 PR은 변경·병합·종료하지 않는다.
- 브랜치 `release/cooking-v2-icecream`, base `main`, Draft PR. 실제 병합과 배포는 사용자가 별도로 실행한다.

포함: 아이스크림 코드 10개, 독립 HTML, 승인 음식 PNG 18개, 매장 배경 1개, 관련 테스트, 메뉴 연결, 빌드·검사·오프라인 캐시 설정과 이 문서/에셋 해시 목록.

제외: `docs/icecream-v1-assets`의 원본·후보·비교 캡처·중간 로그, 참고 시안 4장, 이전 단계별 개발 보고서. 시험 기능의 실제 검증에 쓰는 24개 아이스크림 검사는 유지했다.

## 배경과 화면

사용자 첨부 `icecream-shop-background.png`를 그대로 복사했다. 요청에 쓰인 원본 명칭은 `파스텔_아이스크림_가게_인테리어.png`이며, 실제 확보 파일은 첨부 이름을 따른다.

- 최종 경로: `public/assets/cooking-v2/icecream/background/icecream-shop-background.png`
- 1586×992 PNG, 1,637,788바이트.
- SHA-256: `61333c95bd8292cd0ab433be7ec97f273b4f27b2741d9e7488f5d933a3ff90b0`
- 원본과 저장본의 해시 일치. 승인된 음식 18개도 PR #36의 파일을 그대로 재사용.
- `assets.json`에 19개 파일의 경로·크기·SHA-256을 기록했다.

동일 배경을 네 단계에 적용한다. 비율을 유지하는 cover 표시, 중앙 64% 기준 배치, 약 9% 흰색 오버레이로 음식 대비를 확보한다. 장식 배경은 화면 비율에 따라 일부 잘릴 수 있다. 음식 합성 좌표·버튼 배치는 유지하며, 상단 차양은 기존 CSS 영역을 민트색으로 맞췄다. 원본 PNG는 편집하지 않았다.

## 기능과 경로

컵/콘 변경, 10가지 맛, 1~3스쿱, 터치·드래그, 개별 사용 제한, 스쿱별 보이는 영역, 가까운 빈자리 보정, 시럽 경로, 되돌리기, 저장·이어하기를 그대로 유지한다. 전용 저장 키는 `kids-cooking-v2-icecream-v1`이다.

완성 화면과 저장은 PR #36의 동일 PNG Blob을 사용한다. 매장 배경은 CSS에만 있으며 1400×1400 투명 PNG에 들어가지 않는다. 완성 후 아이스크림 가게로는 같은 게임의 컵/콘 선택 단계로 돌아가며 작품은 유지한다.

- 아이스크림: `/kids-game-playground/prototypes/cooking-v2/icecream/`
- 요리 선택: `/kids-game-playground/prototypes/cooking-v2/kitchen/`
- 아이스크림의 헤더는 위 요리 선택 화면으로 이동한다.
- 기존 선택 화면은 피자 중심이었다. 피자 조작을 유지하고 햄버거·컵케이크·아이스크림의 기존 독립 경로 링크를 각각 한 번만 추가했다.
- 통합 놀이터 홈과 구버전 요리놀이·코디놀이는 변경하지 않았다.

## 오프라인

기존 service worker의 범위·버전·기존 게임 목록은 유지한다. 아이스크림 HTML 두 경로를 추가하고 독립 진입에서도 같은 service worker를 등록한다. 실행 JS/CSS와 PNG 19종의 빌드된 해시 URL은 기존 Vite bundle 기반 캐시 목록에 포함된다. 배경 내용 해시를 캐시 버전에 반영한다. 별도 중복 원본 URL을 추가로 캐싱하지 않는다.

검사에는 모든 캐시 파일 존재, 기존 게임 진입 경로 유지, 신규 PNG 19종 실제 요청 URL의 캐시 존재, 새 브라우저에서 직접 진입 후 네트워크 차단·요리 메뉴 왕복·완성 이어하기·PNG 다운로드가 포함된다. 일반 조작 검사는 매번 전체 오프라인 캐시를 새로 설치하지 않도록 분리하고, 전용 오프라인 검사만 실제 service worker를 사용한다.

## 검사와 캡처

아이스크림 검사 30개(기존 24개 + 통합 6개), 공통 메뉴·캐시 영향에 대한 유지 대상 핵심 검사 7개만 실행한다. 색칠·벽돌·기억력·피자·햄버거의 기존 핵심 검사 각 1개와 컵케이크 반죽 조작 1개, 기존 게임 오프라인 진입 1개이다. 구버전 요리놀이·코디놀이와 기존 전체 254개 검사는 실행하지 않는다.

최종 결과는 PR 본문과 해당 커밋의 GitHub Checks에서 확인한다. 타입·운영 빌드와 `scripts/verify-dist.mjs` 경로 검사도 수행한다. 실제 삼성 기기 테스트는 미실시이며 브라우저 화면 크기로 확인한다.

`icecream-release-review` Actions 아티팩트:

- `release-kitchen-menu.png`: 요리 선택 연결
- `release-tablet-select.png`, `release-tablet-cup-one.png`, `release-tablet-cone-three.png`
- `release-tablet-decorate.png`, `release-tablet-complete.png`
- `release-portrait-*`, `release-landscape-*`: 스마트폰 가로·세로
- `release-png-*.png`, `release-offline.png`: 실제 투명 PNG
- `release-layout-*.json`, `release-offline-proof.json`, `release-cache-files.json`
- PR #36의 완성 화면·PNG 픽셀 비교 결과도 함께 포함

## 배포 전 확인 및 사용자 클릭 순서

작은 가로폰의 3스쿱은 폭이 작게 보일 수 있다. 긴 장식이 위 스쿱 앞에 돌출되는 기존 앞쪽 장식 레이어 방식과 원본 확대의 세부 묘사 한계는 유지한다. PNG는 확대 최대 2배, 배경 제외, 여백 유지 방식이다. 실제 갤럭시탭에서 터치·다운로드·오프라인을 최종 확인하는 것을 권장한다.

1. 최종 통합 PR에서 **Files changed**와 **Checks**를 확인하고 캡처 아티팩트를 검토한다.
2. 승인할 때만 **Ready for review**를 누른다.
3. base가 `main`인지 확인하고 **Merge pull request → Confirm merge**를 사용한다. 기존 PR #33~#36은 이 작업에서 정리하지 않는다.
4. 병합만으로 Pages가 배포되지는 않는다. 저장소 **Actions → Publish to GitHub Pages (manual) → Run workflow**를 연다.
5. 브랜치 **main**을 선택하고 사용자가 직접 **Run workflow**를 실행한다.
6. 해당 실행의 build·deploy 성공 후 배포 페이지의 요리 선택 → 아이스크림을 확인한다.

이 브랜치는 배포 workflow, Pages 권한, manifest와 기존 게임 저장 데이터에 손대지 않는다.
