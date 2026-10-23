# 第六关素材来源

本关只复用前面关卡的奶娃与奶蛋；没有复用前关果实、糖晶或其他物体。

- 奶蛋及奶娃四个成长阶段：`D:/AAA/naidan/source/src/character-mesh.js`，原始模型代码原样复制到 `src/model/character-mesh.js`。五个阶段由原有 CharacterGPU 渲染，再裁去透明边距缓存为画面素材；没有重新建模或更改模型几何。
- GPU绘制代码：`D:/AAA/naidan/fourth-level/src/model/character-gpu.js`。`terrain.js` 是原第四关的相机适配文件。
- 11种水果/奶蛙素材：https://github.com/YHSome/BigNaiWa ，路径 `v1/assets/fruits/*.webp`。本地既有副本来自 `D:/桌面拓展/nailong-pet/assets/bignaiwa`，记录的上游提交 `69436ae9d78b1dce08bb8e07c6703b553e64988b`。源仓库内名称为葡萄、樱桃、橘子、柠檬、猕猴桃、番茄、桃子、菠萝、椰子、半奶蛙、神奶蛙。
- 保留原项目README为 `BigNaiWa-README.md`。仓库README注明“仅供学习娱乐使用”，本快照没有独立LICENSE；以上是来源记录，不表示额外商业授权。
- 炸弹、道场背景、刀光、粒子、界面和音效为本关程序绘制/合成。

切割使用二维画面分片与旋转飞散，未对原始三维网格做实时布尔切割。没有接入源仓库排行榜、赞助页或联网提交功能。
