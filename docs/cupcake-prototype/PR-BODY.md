컵케이크를 독립 시험 경로에서 반죽 만들기 → 컵에 담고 굽기 → 크림·장식 → 완성까지 플레이할 수 있습니다. 기존 홈·게임·피자·햄버거와 저장 키는 그대로 유지합니다.

검토 경로: `/kids-game-playground/prototypes/cooking-v2/cupcake/` (사용자 병합·수동 배포 후 운영 주소에서 확인 가능).

- 원본 9종은 보존하고, 별도 가공본의 투명 여백·색 점을 정리했습니다. 음식은 제공 PNG만 사용합니다.
- 실제 원형 터치로 거품기를 움직이고 반죽 표면만 회전합니다. 문을 연 오븐에 트레이를 끌어 넣고 닫으면 약 3초간 굽습니다.
- 바닐라·딸기 크림을 누르거나 드래그해 키웁니다. 스프링클 원본에서 분리한 작은 3종은 크림의 실제 알파 영역 안에 놓이며 맛을 바꿔도 위치를 유지합니다.
- 되돌리기·장식 제거·확인 후 초기화·자동 저장·이어하기·소리·1400×1400 투명 PNG를 제공합니다.
- 화면/PNG는 같은 배치 계산을 사용하며 실제 SVG/다운로드 PNG 픽셀 비교도 검증합니다.

시험판 제한: 재료 4종의 독립 그림은 없어 한글 카드와 짧은 투입 효과를 사용합니다. 분홍 컵 한 개를 채우고 꾸미며, 나머지 컵 5개는 독립 조리하지 않습니다. 반죽 중간 상태와 크림 중간 단계가 없어 제공 이미지의 추출 질감/균일 크기 변화로 표현합니다. 오븐은 별도 SVG UI이고 딸기에도 바닐라용 짤주머니 그림을 공통 사용합니다. 추가 제작 권장 에셋과 시안 차이는 검수 문서에 명시했습니다.

검증: 빌드·타입·Pages 경로 검사, 기존 게임 전체 회귀 테스트, 컵케이크 터치/저장/반응형/오프라인/PNG 검증. 최종 실행 수치는 `docs/cupcake-prototype/validation.md`를 참조합니다. 실제 Samsung 하드웨어·Samsung Internet·갤러리 저장은 미검증입니다.

[에셋 검수·구현·제한 사항](https://github.com/leedb333/kids-game-playground/blob/feat/cooking-v2-cupcake-prototype/docs/cupcake-prototype/README.md)

![실제 완성 화면](https://raw.githubusercontent.com/leedb333/kids-game-playground/feat/cooking-v2-cupcake-prototype/docs/cupcake-prototype/09-complete.png)

자동 병합·배포하지 않습니다. 음식 합성과 터치 조작 품질 검토를 위한 Draft PR입니다.
