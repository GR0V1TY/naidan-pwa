# 头部素材提取记录

模式：内置 imagegen 编辑；未使用 CLI/API fallback。

输入：用户提供的完整角色图（原图保存在修改前备份中）。
输出：`assets/target-head.png`。生成式提取并清理边缘，未声称与原图逐像素一致。保留原发型、五官、耳朵与微笑，去除脖子、身体和背景。

## 首轮提取提示词

Use case: background-extraction. Edit target: the attached full-body chibi woman reference. Create ONE clean head-only game sprite as an actual transparent-background PNG. Extract and preserve her COMPLETE head, full short dark-brown side-parted bob haircut including all outer hair tips, face and both visible ear contours. Remove ALL neck below the chin, shoulders, clothing, torso, hands and legs and all background. Preserve the exact reference identity: brown eyes, lashes, left-cheek beauty mark, eyebrows, small smiling lips, head angle and soft 3D rendered shading. Do not redesign the face or hairstyle, do not add accessories, crown, text, outlines, shadow, circle, badge, border, scenery, or extra copies. The bottom silhouette must be only the chin and natural hair ends, with fully transparent space beneath, no neck stump. Center this single complete head within a square canvas with approximately 8 percent transparent padding on every side, without clipping any hair. Clean antialiased edges without red or black halo. Transparent background, not a checkerboard painted into the image.

## 最终边缘清理提示词

Edit target: this existing transparent head-only cutout. Make one targeted correction ONLY: clean the outer silhouette of the dark brown hair, eliminating ALL tiny bright red/orange/yellow fringe specks and black halo contamination around the hair and chin. Keep the exact head, face, facial proportions, brown eye colors, eyelash shapes, cheek beauty mark, parted bob haircut, ear, smile, lighting and canvas composition unchanged. Preserve natural smooth dark-brown antialiased hair edges with true partial-alpha edge pixels and fully transparent background. Do not repaint or redesign the character. Do not introduce neck, body, accessories, text, shadow, outline or additional objects. Deliver only the cleaned head on real transparency.

## 校验

PNG 为1254×1254 RGBA，alpha范围0–255。图片本身保留生成器的原始字节；游戏依据完整可见头部区域进行绘制，忽略外部极低alpha杂点，并按轮廓包围圆适配原有碰撞体。校验记录：`evidence/target-asset-check.json`。

