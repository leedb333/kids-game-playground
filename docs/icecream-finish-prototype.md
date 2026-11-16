# 아이스크림 완성 화면·투명 PNG 검수

## 브랜치와 범위

- 기준: PR #35 `feat/cooking-v2-icecream-toppings` / `0e0879be5d23c3d9ad4e1cb45936f08950c36bcc`
- 개발: `feat/cooking-v2-icecream-finish`; PR base는 위 토핑 브랜치.
- PR #33~#35, main, 승인된 이미지 18종, 다른 게임, 홈, 배포 설정은 변경하지 않음.
- 실행 경로: `/kids-game-playground/prototypes/cooking-v2/icecream/`

## 구현

토핑 단계의 완성 보기 → 4단계. 꾸미기 수정은 데이터를 유지하고 3단계로 복귀한다. 다시 만들기는 확인 후 초기화하며 소리 설정은 유지한다. 아이스크림 가게로는 외부 이동 없이 같은 시험 경로의 컵·콘 선택 단계로 돌아간다. 현재 작품은 보존한다.

기존 `composition.render`의 동일 좌표·합성 함수를 호출한 결과만 `finish-image.ts`에서 한 장으로 프레이밍한다. 각 재료의 위치를 다시 계산하거나 토핑을 생성·분산하지 않는다. 완성 화면 캔버스와 다운로드는 같은 `finishImage` 결과를 사용한다. 이미지의 실제 알파 외곽으로 장식까지 포함한 범위를 구해, 원본 비율과 중앙 정렬을 유지한다.

완성·PNG에서는 Canvas 읽기용 소프트웨어 렌더링을 선택해 브라우저 가속 경로 전환에 따른 가장자리 반올림 차이를 방지한다. 기존 플레이 렌더링의 기본 동작과 배치 좌표는 유지한다.

PNG는 1400×1400, 배경은 투명, 가장자리 여백 최소 64px. 합성 원본을 최대 2배까지만 확대하므로 1400px 저장이 원화의 세부 묘사를 새로 만들지는 않는다. UI·배경·짧은 반짝임 효과는 음식 캔버스 밖에 있어 저장에서 제외된다. 반짝임은 한 번 재생하며 움직임 줄이기 설정에서는 표시하지 않는다.

전용 저장 키와 version 1을 유지하고 step 4 및 completed를 확장했다. 기존 toppings 없는 저장도 읽는다. 손상된 데이터는 초기 상태로, 스쿱 없는 완성 저장은 담기 단계로 복구한다. 토핑 좌표·회전·종류·스프링클 점·시럽 경로를 재생성하지 않는다.

## 검증 방법

- 아이스크림 spec 두 개만 실행. 새 검사는 기존 toppings spec에서 등록되어 동일한 GitHub 자동검사에 포함된다.
- 컵·콘 × 1~3스쿱: 토핑 없음 / 6종 꾸미기 / 재실행 후 PNG. 같은 맛 중복과 서로 다른 맛 포함.
- 체리·과자·웨하스는 스쿱의 실제 보이는 영역을 선택해 배치한 데이터로 완성·PNG 비교. 겹침 보정 로직은 PR #35 그대로이다.
- 최대 20회 토핑, 수정·되돌리기, 초기화 취소·확정, 소리 변경 후 캔버스 재표시, 안전한 내부 복귀.
- PNG 서명과 1400×1400 확인 후 브라우저에서 실제 디코딩하여 투명 픽셀, 테두리 여백, 중앙 정렬 확인.
- 음식 화면 픽셀과 PNG를 정확히 비교. 기존 render의 합성 픽셀을 별도로 프레이밍한 결과와도 정확히 비교한다.
- 재실행 전후 저장 데이터는 정확히 비교한다. 재실행 PNG도 실제 디코딩한 전체 픽셀이 정확히 같은지 검사한다. 파일 압축 바이트 동일 여부로 음식 일치를 판단하지 않는다.
- 태블릿 1280×800, 폰 390×844 및 844×390. 실물 삼성 기기 테스트는 미실시.

## 결과 자료

최종 실행 결과는 PR 본문과 해당 커밋의 GitHub Actions 결과에서 확인한다. 실행 명령: `pnpm exec playwright test tests/icecream.spec.ts tests/icecream-toppings.spec.ts --reporter=line` (아이스크림 검사만 포함).

GitHub Actions `icecream-prototype-captures` 아티팩트:

- `finish-bare-{cup|cone}-{1|2|3}.png`: 토핑 없는 제작 화면
- `finish-decorating-{cup|cone}-{1|2|3}.png`: 자유 꾸미기 화면
- `finish-tablet-{cup|cone}-{1|2|3}.png`: 완성 화면
- `png-bare-*`, `png-decorated-*`, `png-resumed-*`: 실제 다운로드 PNG
- `finish-max-tablet.png`, `png-maximum.png`: 최대 토핑
- `finish-phone-portrait.png`, `finish-phone-landscape.png`: 반응형 화면
- `finish-proof-cup.json`, `finish-proof-cone.json`, `resume-pixels-*.json`: 픽셀 검사

## 품질 한계

전용 매장 원화 대신 기존 CSS 배경을 유지한다. 3스쿱과 긴 콘은 전체를 잘림 없이 보여주기 위해 1스쿱보다 폭이 작게 표시된다. 작은 가로폰에서도 같은 제약이 있다. 원본 합성 캔버스 확대에 따른 세부 묘사 한계는 남는다. 아래쪽 스쿱의 긴 장식이 위쪽 스쿱 앞에 일부 돌출되는 기존 앞쪽 장식 레이어 방식도 유지한다. 이번 작업에서는 새 원화나 PNG 전용 재배치를 추가하지 않았다.
