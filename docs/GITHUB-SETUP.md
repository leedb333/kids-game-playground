# GitHub 검토 안내

전용 저장소: https://github.com/leedb333/kids-game-playground

새 저장소 생성은 완료됐습니다. 기존 `kids-color-by-number`와 분리되어 있습니다.

1. 위 저장소 주소를 엽니다.
2. 위쪽 **Pull requests**를 클릭합니다.
3. 홈 화면 개발 PR을 클릭합니다. 작업 브랜치는 `feat/playground-home`입니다.
4. 설명과 화면 캡처를 확인합니다. **Files changed**에서는 추가된 파일을 볼 수 있습니다.
5. **Checks**에서 빌드 결과를 확인합니다.

지금은 검토 단계입니다. **Merge pull request**와 배포 설정은 검수·승인 후 진행합니다. GitHub 저장소 주소는 실제 게임 실행 주소와 다릅니다.

# 검수 후 배포 단계 (지금은 실행하지 않음)

홈 화면 검수 → 작업 PR 확인 → 사용자가 승인한 후 병합 → 별도 배포 승인 순서로 진행합니다. 현재 Actions에는 배포 동작이 없으며 Pages도 설정하지 않았습니다.

배포를 승인하면 수동 실행만 가능한 Pages 작업을 추가하고, 새 저장소의 Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택합니다. `kids-game-playground` 이름을 바꾸면 빌드 경로도 바꿔야 합니다.
