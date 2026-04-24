# Avatar Creation · 形象唤醒

一个纯静态的 H5 形象唤醒交互 Demo：从「闭眼蛋形」到「全身形象」的一系列分镜动画（W1 ~ W7），含光柱降临、倒计时、粒子等舞台化效果。

## 在线访问

启用 GitHub Pages 后访问：

```
https://<your-username>.github.io/<repo-name>/
```

## 本地预览

零依赖，直接用浏览器打开 `index.html` 即可。

也可以用任意静态服务器：

```bash
# Python 3
python3 -m http.server 5173

# Node (需自行安装 serve)
npx serve .
```

然后访问 http://localhost:5173 。

## 项目结构

```
.
├── index.html            # 入口
├── styles/
│   ├── common.css        # 通用基础样式
│   ├── home.css          # 主页/卡片样式
│   └── wakeup.css        # 唤醒动画分镜（W1~W7）样式
├── partials/
│   ├── home.html         # 主页结构
│   └── *.js              # 交互逻辑
└── assets/               # 头像、形象、图标等静态资源
```

## 关键交互

| 阶段 | 内容 |
|---|---|
| W1 | 闭眼蛋形态 + 触摸涟漪 |
| W2 | 长按充能 / 进度环 |
| W3 | 光柱降临（mix-blend screen + 弱→强→弱呼吸） |
| W4 | 形象睁眼 / 显形 |
| W5 | 3-2-1 倒计时（渐变文字 + 多层柔光） |
| W6 | 形象正式登场 |
| W7 | 收束至主页态 |

## License

MIT
