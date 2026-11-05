# GitHub Pages 배포 안내

전용 저장소: https://github.com/leedb333/kids-game-playground

홈 화면 PR #1은 병합됐습니다. 배포 준비는 `chore/pages-deployment`의 별도 PR로 검토합니다. 기존 색칠놀이 저장소는 변경하지 않습니다.

## 준비된 내용

- `Publish to GitHub Pages (manual)` 수동 배포 작업
- PR·코드 업로드·병합으로는 배포하지 않음
- 사람이 Actions에서 실행했을 때만 배포하며 main 외 브랜치는 건너뜀
- 빌드 후 정적 파일·아이콘·오프라인 파일의 존재와 주소 경로 검사
- 실제 배포와 Pages 설정 변경은 이번 준비 단계에서 실행하지 않음

## 1. 배포 준비 PR 병합

1. 저장소 → **Pull requests** → 배포 준비 PR을 엽니다.
2. **Checks**의 검사가 통과했는지 확인합니다.
3. **Ready for review** → **Merge pull request** → **Confirm merge**를 클릭합니다.

병합만으로는 배포되지 않습니다.

## 2. Pages 게시 방식 선택

1. 저장소 상단 **Settings**를 클릭합니다. 좁은 화면에서는 **More** 안에 있을 수 있습니다.
2. 왼쪽 **Pages**를 클릭합니다.
3. **Build and deployment** → **Source**에서 **GitHub Actions**를 선택합니다.
4. 추천 템플릿의 **Configure**는 누를 필요가 없습니다. 배포 파일은 이미 준비되어 있습니다.

## 3. 실제 수동 배포 (배포를 결정한 뒤 진행)

1. 저장소 상단 **Actions**를 클릭합니다.
2. 왼쪽 **Publish to GitHub Pages (manual)**을 클릭합니다.
3. **Run workflow**를 클릭합니다.
4. **Branch: main**을 선택합니다.
5. 초록색 **Run workflow**를 클릭합니다. 이때 실제 공개 배포가 시작됩니다.
6. 새 실행 항목을 열고 build와 deploy가 모두 초록색이 될 때까지 기다립니다.
7. deploy에 표시되는 웹사이트 주소를 엽니다.

예상 주소: https://leedb333.github.io/kids-game-playground/

이 주소는 아직 실행 가능한 사이트로 확인된 주소가 아닙니다. 배포 성공 후 확인해야 합니다.

## 4. 갤럭시 기기 확인

1. 갤럭시탭 Chrome에서 배포 주소를 열고 가로로 돌립니다.
2. 큰 게임 카드 4개와 작은 카드 2개, 준비 중 표시를 확인합니다.
3. 소리 설정을 바꾸고 새로고침한 뒤 설정이 유지되는지 확인합니다. 현재 배경음·효과음은 없습니다.
4. 휴대폰에서도 열어 글자와 카드가 잘 보이는지 확인합니다.
5. 처음 온라인으로 연 뒤 잠시 기다렸다가 인터넷을 끄고 같은 주소를 새로고침해 홈이 열리는지 확인합니다.
6. Chrome 메뉴의 **홈 화면에 추가** 또는 **앱 설치**가 제공되면 선택할 수 있습니다. 메뉴 이름은 브라우저에 따라 다릅니다.

## 이후 업데이트·문제 해결

- 이후 업데이트도 PR 검토·병합 후 위 수동 배포를 반복합니다.
- 예전 화면이 보이면 인터넷 연결 상태에서 앱을 열었다가 관련 창을 모두 닫고 다시 엽니다.
- 빨간 실패 표시가 나오면 Actions의 실패 단계를 이 대화에 알려 주세요.
- 이전 버전으로 되돌릴 때는 변경을 되돌리는 PR을 검토·병합하고 다시 수동 배포합니다.

근거: [GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite 공식 안내](https://vite.dev/guide/static-deploy).
