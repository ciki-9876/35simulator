# 路径档案

《同届生》15 条人生路径的调研档案。每份档案是写事件之前的"知识底稿"：先把真实情况和数据摸清，再据此写事件库 `events/*.json` 和数据表 `data/*.csv`。

## 15 条路径（v1）

| 文件 | 路径 | 事件量目标 | 备注 |
| --- | --- | --- | --- |
| [bigtech.md](bigtech.md) | 互联网与科技大厂 | 200 | 样板；通用变量定义在第 8 节 |
| [whitecollar.md](whitecollar.md) | 企业白领 | 200 | |
| [public.md](public.md) | 体制内 | 180 | |
| [service.md](service.md) | 服务业一线 | 150 | |
| [founder.md](founder.md) | 创业与个体户 | 150 | |
| [freelance.md](freelance.md) | 自由职业与零工 | 140 | |
| [unemployed.md](unemployed.md) | 未就业与慢就业 | 120 | 样板 |
| [study.md](study.md) | 继续深造 | 120 | |
| [factory.md](factory.md) | 制造业与技术工人 | 120 | |
| [creator.md](creator.md) | 内容创作与直播 | 120 | |
| [crime.md](crime.md) | 违法犯罪及后果 | 120 | 样板；第 0 节写作底线 |
| [exam.md](exam.md) | 备考体制 | 100 | |
| [flat.md](flat.md) | 啃老、全职儿女与躺平 | 100 | |
| [grey.md](grey.md) | 灰色地带 | 100 | 第 0 节写作底线同 crime.md |
| [special.md](special.md) | 特殊路径 | 60 | |

9 个生活领域的档案在 [../domains/](../domains/README.md)。

## 档案结构

每份档案按同样的 12 节写：

1. 定义与边界：这条路径包含什么、不包含什么，有哪些子状态
2. 人群规模与画像：真实数据
3. 进入方式与门槛
4. 22–35 岁轨迹：阶段、收入、晋升或恶化
5. 生活强度：时间、身体、心理、钱
6. 转入与转出：和其他路径怎么切换
7. 事件种子清单：按阶段列出，写作时每条扩成 1–4 个事件
8. 与其他路径的交叉事件：只写两两交叉，每一对只在一份档案里展开，另一份放链接
9. 黑话与梗
10. 游戏参数草案：引擎要用的数字
11. 写作注意
12. 数据点与出处，以及待核实事项

## 交叉对的归属

| 交叉对 | 展开在 |
| --- | --- |
| 大厂 × 无业 | [bigtech.md 8.1](bigtech.md#81-大厂--无业) |
| 无业 × 违法 | [unemployed.md 8.1](unemployed.md#81-无业--违法) |
| 违法 × 大厂 | [crime.md 8.1](crime.md#81-违法--大厂) |
| 白领 × 大厂 | [whitecollar.md 8.1](whitecollar.md#81-白领--大厂) |
| 体制内 × 违法 | [public.md 8.1](public.md#81-体制内--违法) |
| 备考体制 × 体制内 | [exam.md 8.1](exam.md#81-备考体制--体制内) |
| 备考体制 × 无业 | [exam.md 8.2](exam.md#82-备考体制--无业) |
| 深造 × 无业 | [study.md 8.1](study.md#81-深造--无业) |
| 深造 × 备考体制 | [study.md 8.2](study.md#82-深造--备考体制) |
| 服务业一线 × 无业 | [service.md 8.1](service.md#81-服务业一线--无业) |
| 制造业 × 服务业一线 | [factory.md 8.1](factory.md#81-制造业--服务业一线) |
| 创业 × 大厂 | [founder.md 8.1](founder.md#81-创业--大厂) |
| 创业 × 无业 | [founder.md 8.2](founder.md#82-创业--无业) |
| 自由职业 × 大厂 | [freelance.md 8.1](freelance.md#81-自由职业--大厂) |
| 内容创作 × 灰色地带 | [creator.md 8.1](creator.md#81-内容创作--灰色地带) |
| 内容创作 × 无业 | [creator.md 8.2](creator.md#82-内容创作--无业) |
| 躺平 × 无业 | [flat.md 8.1](flat.md#81-躺平--无业) |
| 躺平 × 备考体制 | [flat.md 8.2](flat.md#82-躺平--备考体制) |
| 灰色地带 × 违法 | [grey.md 8.1](grey.md#81-灰色地带--违法) |
| 特殊路径 × 备考体制 | [special.md 8.1](special.md#81-特殊路径--备考体制) |

共 20 对路径交叉；另有 9 对"领域 × 路径"交叉，见 [../domains/README.md](../domains/README.md)。

通用变量（`{last_job.entity}`、`{gap_months}`、`{record.type}` 等）定义在 [bigtech.md 第 8 节](bigtech.md#8-与其他路径的交叉事件)。

## 标注约定

- **【数据】**：有出处的真实统计，出处见第 12 节，可以用作事件的数据锚点。
- **【报道】**：来自媒体报道或个案，只能当文案素材，不能当统计写进数据锚点。
- **【设计】**：为了游戏平衡定的参数，不是统计事实，游戏里不能写成"数据显示"。
- **【待核实】**：还没找到可靠出处，上线前必须补上，或者改成【设计】。

事件种子表里的"类型"沿用设计文档的分类：日常、抉择、连锁、宏观、里程碑、回响。
