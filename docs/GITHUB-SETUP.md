# 새 GitHub 저장소 만들기

현재 연결된 저장소 목록에는 통합 앱 전용 저장소가 없어 새 저장소가 필요합니다. 추천 이름은 `kids-game-playground`입니다. 기존 색칠놀이 저장소는 선택하거나 수정하지 마세요.

1. https://github.com/new 를 엽니다.
2. Owner에서 본인 계정 `leedb333`을 선택합니다.
3. Repository name에 `kids-game-playground`를 입력합니다.
4. 무료 GitHub Pages 사용을 위해 `Public`을 선택합니다. 소스 코드가 공개됩니다.
5. `Add README`를 켭니다. `.gitignore`와 License는 지금 선택하지 않습니다.
6. `Create repository`를 클릭합니다.
7. 만들어진 저장소의 주소를 이 대화에 보내 주세요.

그다음 새 저장소의 README 기준으로 작업 브랜치를 연결하고, 이 앱의 변경만 올려 PR을 생성할 수 있습니다. 현재 로컬 작업 브랜치는 미리 준비하지만 원격 PR은 새 저장소가 있어야 생성할 수 있습니다. 원격 업로드·PR 생성 완료 여부를 별도로 확인해야 합니다.

# 검수 후 배포 단계 (지금은 실행하지 않음)

홈 화면 검수 → 작업 PR 확인 → 사용자가 승인한 후 병합 → 별도 배포 승인 순서로 진행합니다. 현재 Actions에는 배포 동작이 없으며 Pages도 설정하지 않았습니다.

배포를 승인하면 수동 실행만 가능한 Pages 작업을 추가하고, 새 저장소의 Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택합니다. `kids-game-playground` 이름을 바꾸면 빌드 경로도 바꿔야 합니다.
