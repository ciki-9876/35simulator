# 同届生

一款网页人生模拟游戏：2014 年 7 月，你和三个室友一起毕业。从 22 岁到 35 岁的十三年里，你会经历求职、大厂、白领、服务业、失业、租房买房、恋爱结婚，和真实的 2014–2027 年一起走过；最后和室友们对照，看看同一届人走出了怎样不同的路。

**在线试玩**：<https://ciki-9876.github.io/35simulator/>

## 目录

| 目录 | 内容 |
| --- | --- |
| `app/` | 游戏本体（Vite + Preact + TypeScript），引擎在 `app/src/engine/` |
| `events/` | 事件库（JSON），写法见 [events/README.md](events/README.md) |
| `data/` | 收入、住房、时间线等数据表，带出处 |
| `research/` | 各路径和领域的调研档案 |
| `tools/` | Python 参考模拟器、事件检查和一致性检查 |
| `reports/` | 模拟结果和调参记录 |

## 本地运行

```bash
npm --prefix app install
npm --prefix app run dev
```

然后打开 <http://localhost:5173>。

## 检查

```bash
python tools/lint_events.py
npm --prefix app run sim -- --lives 2000
```

推送到 `main` 后，GitHub Actions 会自动构建并更新在线试玩版（`gh-pages` 分支）。
