# 事件库

《同届生》的全部事件，按路径或领域分目录，每个 JSON 文件是一个事件数组。内容来源是 `research/` 下的调研档案：每个事件用 `seed` 字段标出它来自档案里的哪个事件种子。

写完或改完事件后运行校验：

```
python -X utf8 tools/lint_events.py
```

然后用模拟器跑 1 万局，看触发率、断掉的连锁和从未触发的事件，报告写到 `reports/sim_report.md`：

```
python -X utf8 tools/simulate.py --lives 10000
```

Windows 终端里中文乱码时，在命令前加 `PYTHONIOENCODING=utf-8`。

## 目录

| 目录 | 来源档案 | 状态 |
| --- | --- | --- |
| `events/bigtech/` | research/paths/bigtech.md | 初稿 |
| `events/unemployed/` | research/paths/unemployed.md | 初稿 |
| `events/crime/` | research/paths/crime.md | 初稿，上线前需法律审核 |
| `events/whitecollar/` | research/paths/whitecollar.md | 初稿 |
| `events/housing/` | research/domains/housing.md | 初稿 |
| `events/love/` | research/domains/love.md | 初稿 |
| `events/family/` | research/domains/family.md | 初稿 |

## 事件格式

```json
{
  "id": "bigtech.growth.first_incident",
  "path": "bigtech",
  "seed": "第一次线上事故",
  "type": "chain",
  "age": [23, 27],
  "when": { "path": "bigtech", "role": "dev" },
  "chance": 0.15,
  "once": true,
  "text": [
    { "t": "你改的一行代码让服务挂了 20 分钟，复盘会上全组都看着你。" },
    { "t": "凌晨的告警是你的提交引起的，你在群里打了一行\"我来处理\"。", "when": { "stat": { "mood": "<40" } } }
  ],
  "effects": { "mood": -5, "ability": 2 }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | `<路径>.<阶段>.<英文短名>`，全库唯一 |
| `path` / `domain` | 二选一 | 所属路径或领域 id |
| `seed` | 是 | 来源档案里的种子名，必须和档案表格第一列一字不差 |
| `type` | 是 | `daily` 日常、`choice` 抉择、`chain` 连锁、`macro` 宏观、`milestone` 里程碑、`echo` 回响 |
| `age` | 是 | `[最小, 最大]`，22–35 |
| `when` | 否 | 触发条件，见下文 |
| `chance` / `weight` / `trigger` | 三选一 | `chance`：满足条件时每年触发的概率，可以是 0–1 的数字，也可以是公式（见"公式"一节）；`weight`：在日常事件池里的相对权重；`trigger: "follow"`：只能由别的事件的 `followups` 触发；`trigger: "path_change"`：路径切换时触发，配合 `transition` |
| `transition` | path_change 必填 | `{ "from": "bigtech", "to": "unemployed" }`，两端都可省略表示任意路径 |
| `once` / `cooldown` | 否 | 一生只发生一次；同一事件两次之间至少隔几年 |
| `text` | 是 | 文案数组，引擎从满足 `when` 的条目里随机取一条；每条正文不超过 60 字（变量不计） |
| `fact` | 否 | 数据锚点 `{ "text": "…", "source": "<来源 id>", "year": 2026 }`，正文不超过 40 字，来源必须在 `data/sources.json` 里；`year` 可选，表示这条数据从哪一年起才存在，游戏年份更早时不显示（避免 2015 年看到 2026 年的数字） |
| `effects` | 否 | 事件发生后的效果，见下文 |
| `options` | 抉择必填 | 2–5 个选项，见下文 |
| `followups` | 否 | `[{ "id": "…", "delay": 年数, "delay_months": 月数, "chance": 0–1 }]`：在 `delay` 年加 `delay_months` 个月之后的同一个月触发（都不写就是当月）。例如发现怀孕到出生写 `"delay_months": 8` |
| `review` | 违法、灰色路径必填 | 固定为 `"legal"`，表示上线前要过法律审核 |
| `help` | 否 | 附加的求助渠道 id：`hotline_12356`、`antifraud_96110`、`legal_aid_12348` |

### 选项

```json
{ "label": "申请劳动仲裁", "hint": "可能拿到更多 · 要拖几个月",
  "p": 0.6, "success": { "money": "2*monthly", "mood": 5 }, "fail": { "mood": -5 },
  "effects": { "flags_add": ["arbitration"] }, "unlock": { "stat": { "social": ">=30" } } }
```

- `label` 不超过 16 字，`hint` 不超过 30 字。
- `p` 是成功概率，可以是数字或公式；有 `p` 时要写 `success` 和 `fail`。
- `unlock` 不满足时选项置灰，`hint` 显示解锁条件。
- `auto` 是自动抉择（室友的人生、玩家开启"自动抉择"）选中这个选项的相对权重，默认 1。用它表达"大多数人会怎么选"，例如生不生时"要一个" 2.5、"不要了" 0.35；不填时各选项等概率。含风险字样的 `hint` 另乘 0.3。

### 条件 `when`

所有键是"且"的关系。比较值写成字符串：`">=60"`、`"<3"`、`"==2"`。

| 键 | 示例 | 含义 |
| --- | --- | --- |
| `path` / `not_path` | `"bigtech"` 或数组 | 当前路径 |
| `sub` | `"outsource"` 或 `["rider", "driver"]` | 当前子状态，可以写成列表：大厂 `fulltime` / `outsource`；白领 `trainee`（管培生：211、985 应届生 30% 以此入职，24 岁转为普通职员）；服务业的工作 `rider`（骑手）/ `courier`（快递员）/ `store`（店员）/ `driver`（网约车司机，要有车且没有犯罪记录）/ `owner`（自己开店），见 `data/service.json`；违法 `prison`；躺平 `carer`（全职照护父母） |
| `tenure` | `">=2"` | 当前工作做了几年（换路径或白领跳槽时归零） |
| `role` | `"dev"` | 岗位类别：`dev` 研发、`product`、`ops`、`design`、`data`、`sales`、`admin`（人事、行政）、`finance`（财务、金融、法务）、`buyer`（采购、选型、审批）。大厂和白领在入职时由引擎抽取，白领的权重见 data/whitecollar.json |
| `level` | `">=3"` | 路径内职级 L1–L6 |
| `stat` | `{ "mood": "<30" }` | `health` `mood` `ability` `social` `savings_months`（存款够几个月生活费） `debt_months`；`home_afford`（存款加父母能给的首付支援，够在本城买一套普通住房的几倍，≥ 1 表示首付和税费够了） `hometown_afford`（同上，按老家的房价） `mortgage_burden`（月供占月收入的比例） |
| `flags` / `not_flags` | `["has_car"]` | 标记 |
| `module` / `not_module` | `"gambling"` | 持续状态模块 |
| `history_any` | `["bigtech"]` | 经历账本里有过这些路径 |
| `history_months` | `{ "unemployed": ">=12" }` | 某条路径累计月数 |
| `gap_months` | `">=6"` | 当前或最近一次空窗 |
| `exit_reason` | `"laid_off"` | 最近一次离职原因：`laid_off` `quit` `probation_fail` `fired` `contract_end` `offer_revoked` |
| `record` | `"criminal"` | 违法记录：`none` `sealed`（治安处罚已封存） `criminal` |
| `degree` / `school_tier` / `family_tier` / `city_tier` | `">=3"` | 开局属性。`degree`：1 专科、2 本科、3 硕士、4 博士；`school_tier`：1 专科、2 普通本科、3 211、4 985 或海外名校；`family_tier`：收入五等分 1–5；`city_tier`：1 一线、2 新一线、3 二线、4 三四线、5 县城 |
| `year` | `">=2026"` | 游戏年份（2014 + 年龄 − 22）。法规生效、政策出台等有明确年份的事件用它限定 |
| `scenario` | `"contraction"` | 时代剧本状态：`expansion` `contraction`（互联网扩张、收缩） `ai_wave` `property_boom` `property_slump`（楼市上行、下行；见 data/timeline.json 的 `property`） |
| `roommate` | `{ "close": ">=70" }` | 至少有一个室友满足；也可写 `path` |
| `living` | `"with_parents"` 或数组 | 居住状态：`with_parents` 住父母家、`shared` 合租、`rent` 整租、`own` 住在自己的房子里（老家有房、人在外地租房时仍是 `shared` / `rent`，用标记 `hometown_home` 区分） |
| `relationship` | `"married"` | 恋爱状态：`single` `dating` `married` |
| `kids` | `">=1"` | 孩子个数 |
| `parent_age` | `">=60"` | 父亲的年龄（开局 47–54 岁，母亲年龄相近） |
| `season` | `"year_end"` 或 `["double11", "year_end"]` | 一年中的时段，取值见 `data/timeline.json` 的 `seasons`：`spring_festival`（1–2 月）、`year_end`（12–1 月，年会、年终总结、年货节）、`spring`（3–5 月）、`may_day`（5 月）、`graduation`（7–8 月）、`summer`（6–8 月）、`rainy`（5–9 月）、`autumn_recruit`（9–11 月）、`civil_exam`（10–11 月）、`double11`（11 月）。写在事件上，概率事件每年只在这些月份里掷一次，日常事件只在这些月份进池；写在文案变体上，只在这些月份用这句。检查工具要求事件能触发的每个月都有一句合适的文案 |
| `age` | `">=30"` | 当前年龄；主要给文案变体用（事件本身用 `age` 区间） |

### 效果 `effects`

| 键 | 示例 | 含义 |
| --- | --- | --- |
| `health` `mood` `ability` `social` | `-5` | 状态增减 |
| `money` | `-2412` 或 `"-0.25*income"` | 存款变化；字符串是公式，见"公式"一节 |
| `flags_add` / `flags_remove` | `["arbitration"]` | 标记 |
| `module_start` / `module_end` | `"gambling"` | 持续状态模块 |
| `path` / `sub` | `"unemployed"` | 切换路径或子状态，同时在经历账本里记一笔。进入服务业时不写 `sub` 就按权重抽一种工作；在服务业里写 `sub` 等于换一份工作：新的工作地点，职级回到 1。骑手和网约车没有试用期 |
| `exit_reason` | `"laid_off"` | 记录离职原因 |
| `record` | `"criminal"` | 记录违法记录 |
| `level` | `1` | 职级变化 |
| `income_mult` | `0.7` | 收入倍率（一次性调整） |
| `roommate_close` | `10` | 和本事件涉及的室友亲疏变化 |
| `modifier` | `{ "job_success": 1.5, "months": 12 }` | 一段时间内的机制修正 |
| `relationship` | `"married"` | 改变恋爱状态（恋爱中或已婚时，引擎每年给心情 +1）。变成 `married` 时，住父母家或合租的人搬进整租（`rent`）；变成 `single` 或 `married` 时清除 `cohabiting` |
| `living` | `"rent"` | 改变居住状态 |
| `kids` | `1` | 孩子个数增减 |
| `buy_home` | `"city"` / `"hometown"` | 在本城或老家买一套普通住房：按当年房价、首付比例和税费扣存款，父母按家境给首付支援，按当年利率贷 30 年。已婚时只算你的一半。设置 `owns_home`（老家另加 `hometown_home`），开启 `mortgage` 模块。在本城买的期房，交房事件再把 `living` 改成 `own` |
| `sell_home` | `true` | 按房子现在的价值卖掉，还清剩余贷款，差额进存款 |
| `prepay` | `0.5` | 拿出这一比例的存款提前还贷，月供随之下降 |
| `parent_health` | `-8` | 父母健康（隐藏值）增减 |
| `company` | `"new"` / `"soe"` / `"foreign"` / `"private"` | 白领换一家公司（跳槽）：重新抽公司类型、岗位和公司名，工龄归零，进入试用期；`"new"` 按权重抽类型。只在当前路径是白领时生效，可以和 `path: "whitecollar"` 写在一起，用来指定进入的公司类型 |

### 引擎维护的标记和模块

下面这些标记不由事件设置，而是由引擎根据状态自动维护，事件可以直接在 `when` 里使用。新增条件时如果用到不在这里、也没有任何事件设置的标记，校验会报错。

| 标记 | 含义 |
| --- | --- |
| `fresh_grad` | 毕业两年内（择业期内） |
| `seeking_bigtech` | 毕业季正在投大厂 |
| `signed_intent` | 已签意向书，还没入职 |
| `multiple_offers` | 手上有 2 个及以上 offer |
| `job_seeking` | 本月在求职 |
| `interviewing` | 本月有面试 |
| `has_offer` | 手上有一个没入职的 offer |
| `background_check` | offer 进入背调 |
| `on_probation` | 在试用期 |
| `promo_eligible` / `promo_passed` | 达到晋升年限 / 本轮晋升通过（由晋升判定写入） |
| `entity_cat_factory` / `entity_goose_factory` | 当前机构是猫厂 / 鹅厂（每个外号机构一个，由 `entities` 生成） |
| `has_car` / `owns_home` | 有车 / 有房（`owns_home` 由 `buy_home` 设置，由 `sell_home` 清除） |
| `hometown_home` | 房子买在老家，人不在那里住 |
| `parents_helped` | 买房时父母给了首付支援 |
| `only_child` | 独生子女（开局决定，比例见 data/household.json） |
| `wc_private` / `wc_foreign` / `wc_soe` | 当前（或最近）一家白领公司是民企 / 外企 / 国企，每次进入白领路径或跳槽时重抽 |
| `startup_options` | 手上有创业公司期权 |
| `ui_under_one_year` | 失业保险缴费不满一年 |
| `module_quit` | 赌博、吸毒等成瘾模块已结束（用于复发） |
| `low_perf` | 由绩效事件设置；引擎在设置满一年后清除。被裁概率的上升用 `layoff` 修正项表达，不靠这个标记 |
| `roommate_released` / `roommate_was_bigtech` | 某个室友离开了违法路径（刑满释放或案子了结） / 某个走上违法路径的室友有过大厂经历。室友的人生由同一个引擎模拟，比你晚一年结算 |

| 模块 | 由谁开启 |
| --- | --- |
| `mortgage` | `buy_home` 开启；还清贷款（含提前还清）或卖房时结束。每年 7 月按 5 年期利率重定价（2023 年起受存量房贷利率下调的上限约束），每月从存款里扣月供 |

### 公式

`chance`、选项的 `p`、效果里的 `money` 都可以写成公式字符串。三处用同一套词汇，校验会检查语法、名字，并用典型状态试算：`chance` 和 `p` 的结果必须落在 0–1 之间（引擎运行时也会截断到 0–1）。

| 类别 | 可用 | 含义 |
| --- | --- | --- |
| 数值 | `age` `level` `tenure` `gap_months` | 年龄、职级、当前或刚离开的工作做了几年、空窗月数 |
| 数值 | `ability` `mood` `health` `social` | 状态，0–100 |
| 数值 | `income` `monthly` `living` | 年收入、月收入、月生活费（元）。都由 `data/income.json` 按年份、路径、职级或工龄、学历、城市算出，2014 年和 2027 年差一倍多；写固定金额时想想放在哪一年，能用公式的尽量用公式。`living` 已经按居住方式、是否和伴侣分担、孩子个数调整过（data/household.json） |
| 数值 | `savings` `mortgage` `home_value` `down_payment` | 存款；本月月供；你那一份房子现在的价值；在本城买一套普通住房现在要准备的现金（首付加税费，不含父母支援） |
| 数值 | `city_tier` | 城市档，1 一线 … 5 县城。婚恋节奏随城市档变化时用，例如求婚概率 `0.06 + 0.08*city_tier` |
| 数值 | `kids` `parent_age` `parent_health` | 孩子个数；父亲年龄；父母健康（0–100，55 岁以后每年下降 1–3） |
| 函数 | `flag("low_perf")` `module("gambling")` | 有这个标记或模块时为 1，否则为 0 |
| 函数 | `mod("layoff")` | 当前所有同名修正项的乘积，没有时为 1 |
| 函数 | `max(a, b)` `min(a, b)` | 取大、取小 |
| 运算 | `+ - * / ( )` | 四则运算 |

例：大厂被裁概率随年龄上升，并受裁员风声、低绩效等修正影响：

```
"chance": "(0.02 + 0.006 * max(0, age - 25)) * mod(\"layoff\")"
```

`mod()` 能用的修正项：`job_success`（求职成功率）、`layoff`（被裁概率）、`promo`（晋升通过率）、`bigtech_interview`（大厂面试通过率）、`ban_same_type`（竞业期禁入同类机构）、`shop_risk`（小店关门的概率）。

### 变量

文案、选项里可以用的变量：`{last_job.entity}` `{last_job.years}` `{last_job.level}` `{exit_reason}` `{gap_months}` `{severance}` `{record.type}` `{next_path}` `{n}` `{name}` `{ta}` `{entity}` `{place}` `{school}` `{city}` `{amount}` `{p}`（选项里的成功率，显示成档位） `{company}`（白领公司名或服务业的工作地点，都是生成的，例如"星达科技""城南站""老街面馆"；网约车司机没有）。

## 写作规范

- 第二人称，一个具体细节，不说教。正文不超过 60 字，数据锚点不超过 40 字。
- 同一事件尽量写 2 条以上文案，按处境用 `when` 区分。
- 违法、灰色路径遵守 research/paths/crime.md 第 0 节：只写处境和后果，不写方法。
- 心情极低、心理、自伤风险相关的事件加 `"help": ["hotline_12356"]`。
