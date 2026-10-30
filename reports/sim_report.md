# 模拟报告

由 `tools/simulate.py` 生成：10000 局，用时 926.0 秒。引擎是最小实现，只用来检查事件库能不能跑通；没有事件的路径和领域用简化的替身，数值都是【设计】值，不代表游戏平衡。

## 总览

| 指标 | 结果 | 设计目标 |
| --- | --- | --- |
| 每年事件数（平均） | 8.6 | 8–12 |
| 每年抉择数（平均） | 1.76 | 1–3 |
| 每年事件数（只算年初在已写路径的年份） | 9.2 | 8–12 |
| 每年抉择数（只算年初在已写路径的年份） | 1.90 | 1–3 |
| 每局不同事件数（平均） | 60.8 | — |
| 两局之间事件重合度（Jaccard） | 32% | 重复率 < 20% |
| 经历 3 条以上路径的局 | 42.8% | 约 70%（全部路径写完后） |
| 有刑事记录 | 1.9% | — |
| 被裁过 | 24.5% | — |
| 进过大厂的人中被大厂裁过 | 30.8% | 30–35% |
| 35 岁时仍在服刑 | 0.1% | — |
| 35 岁存款中位数 | 308669 元 | — |
| 35 岁存款为负 | 11.1% | — |
| 35 岁心情平均 | 49 | — |

## 路径

| 路径 | 35 岁时在这条路径 | 一生中进入过 |
| --- | --- | --- |
| bigtech | 5.1% | 33.2% |
| crime | 0.1% | 1.0% |
| exam | 0.9% | 6.0% |
| flat | 2.7% | 4.8% |
| public | 0.9% | 1.4% |
| service | 19.0% | 29.9% |
| unemployed | 3.8% | 69.1% |
| whitecollar | 67.5% | 84.2% |

## 从未触发的事件（2 条）

- `bigtech.crisis.options_void`（期权）
- `bigtech.entry.offer_revoked`（意向书被毁）

## 极少触发的事件（< 0.2% 的局，6 条）

- `unemployed.cross.bail_interview`（取保期间面试）：0.0%
- `bigtech.cross.fake_commute`（背着电脑包出门）：0.1%
- `unemployed.cross.record_sealed`（记录封存了）：0.1%
- `crime.release.second_chance`（愿意给机会的老板）：0.1%
- `crime.release.relapse`（复吸 / 复赌）：0.1%
- `crime.cross.bonus_bet`（年终奖那晚）：0.1%

## 断掉的连锁

| 目标事件 | 条件不满足 | 超出年龄 | 不存在 |
| --- | --- | --- | --- |
| `housing.big.stock_down` | 3603 | 0 | 0 |
| `family.parents.alone` | 3206 | 0 | 0 |
| `love.meet.first_date` | 1953 | 0 | 0 |
| `crime.case.fired` | 106 | 0 | 0 |
| `crime.prison.partner` | 37 | 0 | 0 |
| `crime.prison.letter` | 30 | 0 | 0 |

35 岁时还排在队列里没执行的后续事件：1221 个。

## 引擎尚未实现的机制

- 无

## 每条事件的触发率

| 事件 | 种子 | 触发过的局 | 平均每局次数 |
| --- | --- | --- | --- |
| `family.daily.parent_phone` | 父母的手机 | 100.0% | 2.86 |
| `family.parents.checkup` | 体检报告 | 99.9% | 2.58 |
| `love.daily.gift_money` | 份子钱 | 99.5% | 4.17 |
| `family.daily.video_call` | 视频电话 | 91.8% | 3.07 |
| `love.daily.weekend` | 一起过周末 | 91.1% | 3.52 |
| `family.spring.go_home` | 回家过年 | 86.5% | 3.26 |
| `housing.buy.viewing` | 看房 | 86.3% | 2.58 |
| `love.meet.crush` | 心动 | 82.8% | 1.61 |
| `whitecollar.entry.badge` | 工牌和工位 | 81.7% | 0.82 |
| `love.together.meet_parents` | 见家长 | 81.2% | 0.88 |
| `family.start.first_salary` | 第一份工资 | 78.7% | 0.79 |
| `whitecollar.daily.ppt` | 汇报 PPT | 78.2% | 3.62 |
| `whitecollar.daily.reimburse` | 报销 | 76.4% | 2.39 |
| `housing.rent.agent_fee` | 中介费 | 75.8% | 1.62 |
| `whitecollar.daily.colleague_wedding` | 同事结婚 | 75.0% | 2.25 |
| `whitecollar.growth.raise_talk` | 加薪谈判 | 72.0% | 2.45 |
| `housing.rent.raise` | 房东涨租 | 70.6% | 1.45 |
| `family.echo.aging` | 父母变老 | 69.8% | 0.70 |
| `unemployed.seek.got_offer` | offer 到手 | 67.8% | 1.04 |
| `love.meet.first_date` | 第一次约会 | 66.6% | 0.79 |
| `housing.buy.decide` | 买房 | 64.5% | 0.96 |
| `love.daily.single_weekend` | 一个人的周末 | 62.8% | 1.26 |
| `love.wed.proposal` | 求婚 | 62.6% | 0.63 |
| `love.wed.registry` | 领证 | 62.6% | 0.63 |
| `love.wed.wedding` | 婚礼 | 62.6% | 0.63 |
| `family.elder.passing` | 祖辈离世 | 60.7% | 0.80 |
| `whitecollar.entry.party_show` | 年会节目 | 60.0% | 0.60 |
| `whitecollar.entry.first_scold` | 第一次被骂 | 59.9% | 0.60 |
| `housing.rent.flatmate` | 合租室友 | 59.6% | 1.53 |
| `housing.rent.moving` | 搬家 | 58.1% | 1.05 |
| `love.kids.decide` | 生不生 | 56.8% | 0.84 |
| `whitecollar.daily.blame` | 背锅 | 56.7% | 0.96 |
| `bigtech.entry.offer_flex` | 群里晒 offer | 55.5% | 0.55 |
| `family.daily.siblings` | 兄弟姐妹 | 55.0% | 2.07 |
| `whitecollar.growth.job_hop` | 跳槽 | 54.2% | 0.86 |
| `family.push.marry` | 催婚 | 52.5% | 1.38 |
| `love.blind.ask` | 相亲 | 52.5% | 1.00 |
| `unemployed.gap.relatives` | 亲戚饭局 | 52.5% | 0.83 |
| `love.together.cohabit` | 同居 | 51.6% | 0.68 |
| `housing.rent.first_room` | 第一次找房 | 51.5% | 0.52 |
| `love.wed.bride_price` | 彩礼 | 51.2% | 0.57 |
| `family.parents.downpay` | 首付支援 | 50.6% | 0.51 |
| `housing.buy.sign` | 签合同 | 50.6% | 0.51 |
| `love.start.long_distance` | 异地恋 | 50.2% | 0.72 |
| `housing.rent.commute` | 通勤 | 49.2% | 2.03 |
| `whitecollar.daily.mentor` | 带新人 | 48.7% | 1.44 |
| `family.spring.dinner` | 年夜饭 | 45.6% | 0.65 |
| `love.kids.pregnant` | 怀孕 | 43.5% | 0.51 |
| `housing.own.rate_cut` | 房贷利率下调 | 43.4% | 0.43 |
| `family.parents.ill` | 父母生病 | 42.7% | 0.58 |
| `family.parents.bill` | 医药费 | 42.7% | 0.58 |
| `whitecollar.growth.promotion` | 升主管 | 42.7% | 0.62 |
| `love.blind.scene` | 相亲现场 | 41.7% | 0.60 |
| `family.spring.rush` | 春运 | 40.7% | 0.54 |
| `family.parents.scam` | 防诈骗 | 39.3% | 0.46 |
| `housing.rent.solo` | 一个人住 | 39.2% | 0.48 |
| `whitecollar.growth.transfer` | 调岗 | 39.2% | 0.49 |
| `love.kids.newborn` | 新生儿 | 39.2% | 0.46 |
| `love.kids.childcare` | 带娃 | 39.2% | 0.46 |
| `love.kids.first_word` | 孩子开口 | 38.5% | 0.39 |
| `unemployed.mind.small_joy` | 小确幸 | 37.4% | 0.50 |
| `unemployed.seek.read_no_reply` | 已读不回 | 37.3% | 0.49 |
| `unemployed.seek.mass_apply` | 海投 | 36.6% | 0.49 |
| `housing.buy.keys` | 交房 | 35.8% | 0.36 |
| `housing.buy.renovation` | 装修 | 35.8% | 0.36 |
| `love.wed.marital_home` | 婚房 | 33.1% | 0.34 |
| `crime.cross.scammed` | 被骗钱 | 32.7% | 0.33 |
| `unemployed.seek.lower_bar` | 降低期望 | 31.7% | 0.41 |
| `whitecollar.echo.age30` | 30 岁的会 | 31.4% | 0.31 |
| `unemployed.policy.register` | 失业登记 | 31.3% | 0.31 |
| `housing.rent.partition` | 隔断间 | 31.1% | 0.79 |
| `bigtech.growth.req_change` | 需求改了三版 | 30.2% | 0.89 |
| `unemployed.gap.skill` | 学技能 | 29.8% | 0.37 |
| `family.parents.ward` | 陪护 | 29.1% | 0.35 |
| `whitecollar.daily.trip` | 出差 | 29.1% | 1.76 |
| `bigtech.growth.pua` | 被 PUA | 29.1% | 0.75 |
| `unemployed.seek.greeting_limit` | 打招呼上限 | 28.9% | 0.36 |
| `bigtech.growth.slacking` | 摸鱼 | 28.8% | 0.75 |
| `housing.rent.landlord_sells` | 房东卖房 | 28.7% | 0.33 |
| `bigtech.growth.anon_forum` | 脉脉 | 28.3% | 1.00 |
| `bigtech.growth.farewell_dinner` | 同事离职饭 | 28.2% | 0.70 |
| `love.kids.second` | 二胎 | 28.0% | 0.29 |
| `bigtech.echo.old_badge` | 旧工牌 | 26.4% | 0.26 |
| `housing.own.price_drop` | 房价跌了 | 26.1% | 0.32 |
| `bigtech.growth.team_building` | 团建 | 25.8% | 0.65 |
| `housing.own.prepay` | 提前还贷 | 25.2% | 0.35 |
| `whitecollar.daily.checkup` | 体检 | 25.1% | 0.25 |
| `love.together.breakup` | 分手 | 24.8% | 0.29 |
| `bigtech.growth.checkup` | 体检 | 24.7% | 0.53 |
| `bigtech.echo.mentor_now` | 导师去向 | 24.4% | 0.24 |
| `crime.cross.graft_notice_known` | 内部反腐通报 | 24.0% | 0.27 |
| `bigtech.cross.last_day` | 最后一天 | 23.7% | 0.25 |
| `unemployed.mind.self_doubt` | 自我怀疑 | 23.4% | 0.28 |
| `bigtech.entry.mentor` | 新人导师 | 23.1% | 0.23 |
| `whitecollar.sales.client_dinner` | 客户饭局 | 23.0% | 0.58 |
| `unemployed.down.delivery` | 先送外卖 | 22.1% | 0.26 |
| `bigtech.growth.annual_bonus` | 年终奖 | 22.0% | 1.33 |
| `bigtech.growth.reorg` | 组织架构调整 | 21.6% | 0.40 |
| `whitecollar.sales.quota` | 业绩考核 | 21.4% | 0.47 |
| `whitecollar.crisis.pay_cut` | 降薪 | 21.3% | 0.21 |
| `housing.rent.deposit` | 押金 | 21.2% | 0.25 |
| `bigtech.entry.mass_apply` | 海投 | 20.9% | 0.21 |
| `bigtech.growth.neck` | 颈椎 | 20.8% | 0.30 |
| `bigtech.growth.annual_party` | 年会 | 20.5% | 0.74 |
| `whitecollar.exit.exam` | 想上岸 | 20.0% | 0.20 |
| `bigtech.growth.stock_vest` | 股票归属 | 19.9% | 0.67 |
| `housing.buy.hometown` | 回老家买房 | 19.6% | 0.21 |
| `bigtech.growth.promo_defense` | 晋升答辩 | 19.4% | 1.10 |
| `bigtech.growth.promo_result` | 晋升结果 | 19.4% | 1.10 |
| `unemployed.policy.grace_period` | 择业期 | 19.3% | 0.19 |
| `family.parents.alone` | 一个人扛 | 18.9% | 0.26 |
| `bigtech.crisis.downshift` | 降薪跳槽 | 18.9% | 0.19 |
| `whitecollar.cross.from_bigtech` | 被叫"大厂来的" | 18.8% | 0.19 |
| `unemployed.gap.certificate` | 考证 | 17.4% | 0.19 |
| `whitecollar.cross.six_pm` | 下午六点 | 17.1% | 0.17 |
| `family.parents.move_in` | 接来同住 | 17.1% | 0.17 |
| `whitecollar.cross.no_use` | 用不上 | 17.0% | 0.17 |
| `unemployed.down.savings_low` | 存款见底 | 16.9% | 0.22 |
| `unemployed.down.borrow` | 借钱 | 16.9% | 0.22 |
| `whitecollar.crisis.wage_arrears` | 拖欠工资 | 16.8% | 0.19 |
| `whitecollar.crisis.arbitration` | 劳动仲裁 | 16.8% | 0.19 |
| `family.daily.group` | 家族群 | 16.7% | 0.72 |
| `bigtech.entry.rote_answers` | 八股文 | 16.4% | 0.16 |
| `unemployed.policy.file_transfer` | 档案去哪 | 16.3% | 0.16 |
| `bigtech.crisis.layoff_rumor` | 裁员风声 | 16.3% | 0.27 |
| `whitecollar.exit.bigtech_interview` | 大厂的面试 | 16.2% | 0.16 |
| `whitecollar.growth.hometown_branch` | 回老家分公司 | 15.6% | 0.16 |
| `love.start.grad_breakup` | 毕业分手 | 15.3% | 0.15 |
| `unemployed.policy.benefit` | 失业保险 | 15.3% | 0.15 |
| `whitecollar.crisis.laid_off` | 被裁 | 15.2% | 0.16 |
| `bigtech.crisis.side_hustle` | 副业 | 15.2% | 0.15 |
| `whitecollar.growth.cert` | 考证 | 14.6% | 0.15 |
| `love.crisis.fight` | 婚姻危机 | 14.2% | 0.16 |
| `unemployed.gap.hide_moments` | 屏蔽朋友圈 | 13.6% | 0.14 |
| `whitecollar.cross.ex_colleague` | 前同事的朋友圈 | 13.6% | 0.14 |
| `unemployed.seek.group_interview` | 群面 | 13.4% | 0.15 |
| `bigtech.crisis.overwork_news` | 猝死新闻 | 13.4% | 0.15 |
| `unemployed.seek.gap_question` | 空窗期 | 13.3% | 0.15 |
| `whitecollar.growth.politics` | 站队 | 13.2% | 0.18 |
| `unemployed.mind.insomnia` | 失眠 | 13.0% | 0.15 |
| `bigtech.growth.late_release` | 凌晨发版 | 13.0% | 0.49 |
| `bigtech.entry.first_day` | 第一天 | 12.7% | 0.13 |
| `love.echo.alone` | 一个人 | 12.4% | 0.12 |
| `bigtech.growth.oncall` | on-call | 12.4% | 0.37 |
| `bigtech.growth.headhunter` | 猎头电话 | 12.4% | 0.27 |
| `bigtech.cross.quit` | 裸辞 | 12.2% | 0.22 |
| `family.care.need` | 家里需要人 | 12.0% | 0.12 |
| `unemployed.down.tutoring` | 兼职家教 | 11.3% | 0.12 |
| `bigtech.growth.perf_review` | 绩效季 | 10.9% | 0.13 |
| `bigtech.crisis.outsource_party` | 外包不能去年会 | 10.8% | 0.56 |
| `unemployed.mind.stay_in` | 不想出门 | 10.7% | 0.13 |
| `unemployed.mind.reach_out` | 求助 | 10.7% | 0.13 |
| `bigtech.crisis.ai_wave` | AI 冲击 | 10.6% | 0.11 |
| `unemployed.seek.spring_hire` | 春招补录 | 10.4% | 0.10 |
| `bigtech.crisis.laid_off` | 被优化 | 10.2% | 0.11 |
| `unemployed.seek.unpaid_trial` | 无薪试岗 | 10.1% | 0.10 |
| `bigtech.entry.pick_offer` | 选 offer | 10.1% | 0.10 |
| `unemployed.gap.parents_look` | 父母的眼神 | 10.1% | 0.12 |
| `housing.big.top_buy` | 高位上车 | 9.9% | 0.10 |
| `bigtech.entry.outsource_badge` | 外包工牌 | 9.8% | 0.19 |
| `bigtech.entry.nickname` | 花名 | 9.6% | 0.10 |
| `whitecollar.cross.no_return` | 回不去 | 9.4% | 0.09 |
| `crime.cross.after_party` | 年会之后 | 9.4% | 0.15 |
| `crime.lure.designated_driver` | 代驾 | 9.4% | 0.15 |
| `bigtech.cross.lower_offer` | 开价六成 | 9.3% | 0.09 |
| `unemployed.seek.connections` | 托关系 | 8.9% | 0.09 |
| `unemployed.gap.dorm_group` | 宿舍群 | 8.9% | 0.09 |
| `bigtech.growth.job_hop` | 跳槽 | 8.9% | 0.14 |
| `unemployed.seek.probation_fail` | 试用期没过 | 8.5% | 0.09 |
| `bigtech.crisis.graft_notice` | 内部反腐通报 | 8.2% | 0.09 |
| `unemployed.down.move_home` | 退租回家 | 8.1% | 0.08 |
| `bigtech.crisis.tech_or_mgmt` | 技术还是管理 | 7.5% | 0.07 |
| `bigtech.crisis.join_ai` | 转 AI | 7.4% | 0.07 |
| `whitecollar.cross.jargon` | 黑话不通 | 7.3% | 0.07 |
| `whitecollar.cross.pace` | 节奏 | 7.3% | 0.07 |
| `unemployed.gap.decide` | 决定 gap | 7.2% | 0.07 |
| `unemployed.late.mortgage` | 房贷 | 7.0% | 0.07 |
| `whitecollar.growth.cert_pass` | 证书通过 | 6.7% | 0.20 |
| `bigtech.cross.halo` | 光环 | 6.5% | 0.07 |
| `love.crisis.cooling` | 离婚冷静期 | 6.2% | 0.06 |
| `whitecollar.crisis.foreign_exit` | 外企中国区 | 6.2% | 0.06 |
| `bigtech.growth.near_office` | 后厂村 / 西二旗 | 6.1% | 0.06 |
| `bigtech.growth.office_romance` | 同事恋爱 | 6.0% | 0.06 |
| `bigtech.echo.ten_years` | 十年司龄 | 5.6% | 0.06 |
| `bigtech.growth.first_incident` | 第一次线上事故 | 5.6% | 0.06 |
| `housing.big.near_office` | 公司附近 | 5.3% | 0.14 |
| `unemployed.cross.that_message` | 那条群消息 | 5.3% | 0.05 |
| `bigtech.crisis.arbitration` | 仲裁结果 | 5.3% | 0.05 |
| `bigtech.echo.birthday_desk` | 35 岁生日在工位 | 5.1% | 0.05 |
| `unemployed.policy.follow_up` | 一对一帮扶 | 4.9% | 0.06 |
| `family.care.fulltime` | 全职照护 | 4.8% | 0.05 |
| `unemployed.late.age_bar` | 年龄门槛 | 4.8% | 0.05 |
| `unemployed.late.age_echo` | 年龄回响 | 4.8% | 0.05 |
| `whitecollar.entry.rotation` | 管培轮岗 | 4.7% | 0.06 |
| `bigtech.crisis.deliver_news` | 谈下属 | 4.7% | 0.05 |
| `unemployed.seek.training_loan` | 培训贷陷阱 | 4.6% | 0.05 |
| `bigtech.crisis.go_home` | 回老家 | 4.5% | 0.05 |
| `unemployed.gap.fake_work` | 假装上班 | 4.4% | 0.05 |
| `bigtech.cross.dorm_group` | 宿舍群 | 4.3% | 0.04 |
| `housing.big.stock_down` | 用股票付首付 | 4.2% | 0.04 |
| `family.care.allowance` | 父母的工资 | 4.0% | 0.09 |
| `unemployed.down.move_city` | 换城市 | 4.0% | 0.04 |
| `whitecollar.cross.downshift` | 降级求稳 | 3.9% | 0.04 |
| `family.care.two_views` | 两种眼光 | 3.8% | 0.08 |
| `crime.cross.colleague_taken` | 同事被带走 | 3.8% | 0.04 |
| `bigtech.growth.internal_transfer` | 内部转岗 | 3.6% | 0.05 |
| `bigtech.cross.referral` | 前同事内推 | 3.6% | 0.04 |
| `unemployed.down.flyers` | 发传单 | 3.6% | 0.04 |
| `unemployed.cross.gamble_to_survive` | 翻本 | 3.6% | 0.04 |
| `bigtech.cross.severance_gone` | N+1 花完了 | 3.4% | 0.03 |
| `bigtech.cross.alumni_group` | 毕业生联谊群 | 3.1% | 0.03 |
| `unemployed.cross.classmate_project` | 老同学的项目 | 2.9% | 0.03 |
| `crime.lure.roommate_warns` | 室友提醒 | 2.9% | 0.03 |
| `bigtech.crisis.mortgage_layoff` | 房贷 + 裁员 | 2.9% | 0.03 |
| `crime.case.summoned` | 被传唤 | 2.8% | 0.03 |
| `crime.case.tell_family` | 告诉家里 | 2.8% | 0.03 |
| `unemployed.late.ride_hailing` | 跑网约车 | 2.7% | 0.03 |
| `bigtech.cross.explain_gap` | 空窗期怎么说 | 2.6% | 0.03 |
| `bigtech.entry.algo_test` | 算法题 | 2.4% | 0.02 |
| `crime.case.fired` | 被开除 | 2.3% | 0.02 |
| `bigtech.cross.fired_no_pay` | 违纪没有赔偿 | 2.2% | 0.02 |
| `bigtech.cross.severance` | 赔偿到账 | 2.0% | 0.02 |
| `crime.case.bail` | 取保 | 2.0% | 0.02 |
| `bigtech.cross.insurance_gap` | 社保断缴 | 1.9% | 0.02 |
| `bigtech.cross.parents_unaware` | 父母还不知道 | 1.9% | 0.02 |
| `crime.case.verdict` | 判决 | 1.9% | 0.02 |
| `crime.release.restart` | 重新开始 | 1.9% | 0.02 |
| `bigtech.crisis.age_resume` | 35 岁简历 | 1.9% | 0.02 |
| `crime.lure.dui_stop` | 只喝了一点 | 1.8% | 0.02 |
| `family.care.after` | 父母走了以后 | 1.8% | 0.02 |
| `unemployed.cross.daily_cash_job` | 日结兼职 | 1.8% | 0.02 |
| `bigtech.cross.stack_changed` | 技术栈变了 | 1.7% | 0.02 |
| `crime.case.parents_react` | 父母的反应 | 1.7% | 0.02 |
| `crime.case.restitution` | 退赃 | 1.7% | 0.02 |
| `crime.cross.roommate_arrested` | 室友出事 | 1.5% | 0.02 |
| `crime.lure.pyramid` | 外地考察 | 1.5% | 0.01 |
| `bigtech.crisis.outsource_convert` | 外包转正 | 1.4% | 0.01 |
| `crime.cross.lookup_user` | 帮忙查个人 | 1.4% | 0.01 |
| `crime.cross.returned_envelope` | 当年退回的信封 | 1.4% | 0.01 |
| `housing.own.default_edge` | 断供边缘 | 1.4% | 0.02 |
| `crime.overseas.high_pay` | 高薪 offer | 1.2% | 0.01 |
| `unemployed.cross.loan_shark` | 网贷催收 | 1.2% | 0.01 |
| `crime.cross.roommate_named` | 室友被通报 | 1.2% | 0.01 |
| `crime.case.probation` | 缓刑 | 1.1% | 0.01 |
| `crime.release.civil_closed` | 考公无缘 | 1.1% | 0.01 |
| `crime.prison.first_month` | 第一个月 | 1.0% | 0.01 |
| `crime.prison.visit` | 探视 | 1.0% | 0.01 |
| `crime.release.no_record_cert` | 无犯罪记录证明 | 1.0% | 0.02 |
| `unemployed.late.hide_from_spouse` | 瞒着家里 | 1.0% | 0.01 |
| `crime.cross.vendor_dinner` | 供应商的饭局 | 0.9% | 0.01 |
| `unemployed.cross.after_dismissal` | 被开除之后 | 0.9% | 0.01 |
| `unemployed.cross.no_ride_hailing` | 网约车也不行 | 0.9% | 0.01 |
| `bigtech.cross.noncompete` | 竞业限制 | 0.9% | 0.01 |
| `housing.big.sell` | 卖房 | 0.8% | 0.01 |
| `crime.release.out` | 出狱 | 0.8% | 0.01 |
| `bigtech.cross.back_as_contractor` | 以外包身份回来 | 0.8% | 0.01 |
| `bigtech.cross.passenger_talk` | 乘客聊裁员 | 0.8% | 0.01 |
| `crime.lure.card_lent` | 兼职广告 | 0.8% | 0.01 |
| `unemployed.cross.that_year` | 那一年 | 0.8% | 0.01 |
| `crime.lure.phone_rings` | 手机一响 | 0.8% | 0.02 |
| `crime.prison.skill` | 学手艺 | 0.8% | 0.01 |
| `crime.cross.offer_withdrawn` | 背调撤回 offer | 0.7% | 0.01 |
| `unemployed.policy.internship` | 就业见习 | 0.7% | 0.01 |
| `unemployed.cross.roommate_stop` | 室友劝住 | 0.7% | 0.01 |
| `crime.lure.card_frozen` | 卡被冻了 | 0.7% | 0.01 |
| `crime.prison.partner` | 伴侣 | 0.7% | 0.01 |
| `crime.release.dorm_group` | 宿舍群 | 0.7% | 0.01 |
| `unemployed.cross.resettlement` | 安置帮教 | 0.6% | 0.01 |
| `crime.case.admin_penalty_pyramid` | 被传唤 | 0.6% | 0.01 |
| `unemployed.gap.backpacking` | 穷游 | 0.6% | 0.01 |
| `bigtech.cross.boomerang` | 老东家回流 | 0.6% | 0.01 |
| `crime.case.surrender` | 主动投案 | 0.5% | 0.01 |
| `unemployed.cross.disclose_record` | 如实报告 | 0.5% | 0.01 |
| `love.public.insist` | 一定要体制内 | 0.5% | 0.01 |
| `unemployed.cross.frozen_while_jobless` | 失业中被冻卡 | 0.5% | 0.01 |
| `unemployed.seek.overseas_offer` | 境外高薪 | 0.5% | 0.00 |
| `crime.cross.lend_to_released` | 帮不帮 | 0.5% | 0.00 |
| `bigtech.cross.late_entry` | 落榜一年后 | 0.5% | 0.00 |
| `crime.cross.audit_talk` | 内审约谈 | 0.4% | 0.00 |
| `crime.cross.on_the_list` | 通报名单 | 0.4% | 0.00 |
| `crime.cross.no_severance` | 没有赔偿 | 0.4% | 0.00 |
| `crime.prison.letter` | 室友的信 | 0.4% | 0.00 |
| `crime.release.sealed` | 治安处罚被封存 | 0.4% | 0.00 |
| `unemployed.cross.stay_home_after` | 父母说先在家待着 | 0.4% | 0.00 |
| `crime.cross.check_passed` | 背调过了 | 0.4% | 0.00 |
| `crime.overseas.passport` | 证件被收 | 0.3% | 0.00 |
| `crime.overseas.missing` | 失联 | 0.3% | 0.00 |
| `love.public.bonus` | 相亲加分 | 0.3% | 0.00 |
| `crime.overseas.rescued` | 被解救 | 0.3% | 0.00 |
| `crime.cross.age35` | 35 岁 | 0.3% | 0.00 |
| `crime.overseas.silence` | 不敢讲 | 0.3% | 0.00 |
| `unemployed.cross.out_of_town_offer` | 外地的 offer | 0.3% | 0.00 |
| `crime.cross.small_company` | 小公司收留 | 0.2% | 0.00 |
| `love.public.wed_year` | 上岸那年 | 0.2% | 0.00 |
| `crime.case.admin_penalty_gambling` | 被传唤 | 0.2% | 0.00 |
| `crime.release.disclose` | 如实报告 | 0.2% | 0.00 |
| `unemployed.cross.after_scam_compound` | 被骗出境回来后 | 0.2% | 0.00 |
| `unemployed.cross.old_friend_returns` | 旧朋友又来了 | 0.2% | 0.00 |
| `crime.overseas.investigated` | 回国调查 | 0.2% | 0.00 |
| `crime.cross.shady_gig` | 涉罪的私活 | 0.2% | 0.00 |
| `crime.release.second_chance` | 愿意给机会的老板 | 0.1% | 0.00 |
| `crime.release.relapse` | 复吸 / 复赌 | 0.1% | 0.00 |
| `crime.cross.bonus_bet` | 年终奖那晚 | 0.1% | 0.00 |
| `bigtech.cross.fake_commute` | 背着电脑包出门 | 0.1% | 0.00 |
| `unemployed.cross.record_sealed` | 记录封存了 | 0.1% | 0.00 |
| `unemployed.cross.bail_interview` | 取保期间面试 | 0.0% | 0.00 |
| `bigtech.crisis.options_void` | 期权 | 0.0% | 0.00 |
| `bigtech.entry.offer_revoked` | 意向书被毁 | 0.0% | 0.00 |
