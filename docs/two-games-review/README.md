# 두 게임 놀이터 검수

Chromium에서 프로덕션 빌드를 실행하고 태블릿·스마트폰 뷰포트와 터치를 모의했습니다.

| 검수 | 캡처 |
|---|---|
| 홈 전후 비교, 1280×720 | [이전 5개 카드](home-before.png) · [정리 후 2개 카드](home-tablet-16x9.png) |
| 홈 1280×800 | [태블릿](home-tablet.png) |
| 홈 스마트폰 | [가로 800×360](home-phone-landscape.png) · [세로 360×800](home-phone.png) |
| 두 게임 실제 플레이 | [벽돌깨기](bricks-tablet.png) · [짝꿍 카드 20장](memory-tablet.png) |
| 서비스 워커 전환 후 오프라인 | [벽돌깨기](offline-brick-game.png) · [짝꿍 카드](offline-memory-game.png) · [캐시·저장 검사 JSON](upgrade-and-storage.json) |

## 서비스 워커 전환 재현

`PLAYGROUND_UPGRADE_BUILDS`에 다음과 같이 같은 출처에서 제공할 세 프로덕션 빌드의 상위 디렉터리를 지정하고, 정리 후 앱을 `dist/`에 빌드합니다. 이 변수 없이 실행하면 실제 앱 세 개를 사용하는 전환 테스트만 건너뜁니다.

| 하위 디렉터리 | 기준 커밋 |
|---|---|
| `baseline/` | 종합 놀이터 `d608a79becc6ea9731c7ddf72ef8671fe25eb92e` |
| `kids-coloring-studio/` | 색칠놀이터 `7a493327413a7547ef760006b72fcd3198b1fe6d` |
| `kids-cooking-studio/` | 요리놀이터 `20b5d36b90f5450c27bea4b71efb81c93fcb53c7` |

```sh
PLAYGROUND_UPGRADE_BUILDS=/path/to/builds pnpm exec playwright test tests/pwa-upgrade.spec.ts
```

이전 종합 앱 탭이 열린 동안 새 워커가 대기하고 이전 앱을 오프라인에서 열 수 있는지 확인합니다. 탭을 닫은 뒤 새 워커가 활성화되면 두 게임이 오프라인에서 열리고 이전 종합 앱 캐시가 정리되는지 검사합니다. 독립 앱의 캐시 이름·URL 목록과 합성 저장값 11개의 원문을 비교하고, 기존 경찰차 색칠과 아이스크림을 다시 엽니다.

실제 갤럭시탭에서 기존 설치 앱 전환, 터치·효과음·저장, 독립 앱 이어하기를 별도로 확인해야 합니다.
