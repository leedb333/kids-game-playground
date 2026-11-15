# Draft PR 수동 생성

코드와 검수 자료는 `feat/cooking-v2-cupcake-prototype` 브랜치에 업로드했습니다. 연결 도구가 PR 생성 요청에 `403 Resource not accessible by integration`을 반환했고, 별도 Chrome은 GitHub에 로그인되지 않은 상태여서 PR은 아직 생성되지 않았습니다. 병합·배포는 하지 않았습니다.

1. GitHub에 로그인한 뒤 [PR 작성 화면](https://github.com/leedb333/kids-game-playground/compare/main...feat/cooking-v2-cupcake-prototype?expand=1)을 엽니다.
2. 기준이 `base: main`, 비교 대상이 `compare: feat/cooking-v2-cupcake-prototype`인지 확인합니다. 필요한 경우 초록색 **Create pull request**를 누르면 작성 양식이 열립니다.
3. 제목은 **feat: 요리놀이 2.0 컵케이크 4단계 시험판**으로 입력합니다.
4. [준비된 PR 설명](https://github.com/leedb333/kids-game-playground/blob/feat/cooking-v2-cupcake-prototype/docs/cupcake-prototype/PR-BODY.md)의 내용을 복사해 본문에 붙여넣습니다.
5. 작성 양식 아래 **Create pull request** 오른쪽의 **▼**를 누르고 **Create draft pull request**를 선택해 생성합니다.

PR 생성 후 GitHub Actions 검사가 실행됩니다. 로컬 검증은 [검증 기록](validation.md)에 있습니다. 실제 게임을 검토하기 전에는 Ready for review·Merge·배포를 진행하지 않아도 됩니다.
