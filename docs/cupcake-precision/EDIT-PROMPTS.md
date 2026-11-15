# 내부 복원 편집 요청 기록

실행 방식: 내장 이미지 편집 기능. 각 원본을 edit target으로 직접 제공하고 투명 배경을 요청했습니다. 생성 결과 전체가 아니라 필요한 내부만 최종 합성에 사용했습니다. 원본 파일은 보존합니다.

## 빈 볼 후보

Edit target: `public/assets/cooking-v2/cupcake/mixing-bowl-batter.png`.

> Precise object edit of the attached existing game asset, NOT a new bowl design. Remove ONLY the yellow batter inside the pink mixing bowl and restore the empty pink inner wall/floor that the batter concealed. Preserve the exact original silhouette, placement, scale, camera, heart decoration, scallops, base, highlights, rim and every exterior detail. Keep the original square canvas with bowl at the exact original coordinates and same size (1254 x1254 reference). No repositioning, no new ornament, no food, no tool, no text, no cast background. Actual transparent RGBA background. This is an inpaint restoration: restore smooth shaded pink bowl interior, natural depth and continuity at the original inner rim. The existing entire outside of the bowl must remain identical. Produce one empty bowl edit only.

후보 결과: `restoration-source/bowl-restoration.png`. 원본과 미세하게 달라진 외부는 최종본에서 사용하지 않았습니다.

## 빈 컵 후보

Edit target: `public/assets/cooking-v2/cupcake/cupcake-baked-base.png`.

> Precise masked-style restoration of the attached existing cupcake asset. Remove ONLY the golden cake, reveal an EMPTY PAPER CUP. Do not redesign the existing visible front paper wrapper. Preserve its exact original narrow tapered silhouette, three cream heart motifs, vertical pink pleats, original wavy WHITE FRONT LIP located around y=550..680 of the 1254 square reference, bottom at original y~1082, original scale and exact placement. Reconstruct only the formerly cake-occluded BACK RIM and inside of this SAME paper cup. Back rim should be a subtle shallow elliptical fluted edge behind the original front lip, not an enormous tall cup; same original width, perspective, paper folds, pink shading. Existing front paper pixels, heart positions, scalloped front white edge must remain unchanged; no shifting or resizing. Original square canvas and transparent margins, actual RGBA transparent background. No batter, no cake, no sprinkles, no plate, no extra objects or text. One image of this identical cup with empty pink interior only. Think removing cake from a fixed cup, never making a different cup.

후보 결과: `restoration-source/cup-restoration.png`. 원본 앞면과 미세한 픽셀 차이가 있으므로 최종 앞면으로 사용하지 않고, 뒤·안쪽만 분리했습니다. 최종 앞면은 기존 원본에서 직접 복사했습니다.
