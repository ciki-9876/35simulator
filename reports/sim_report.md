# 模拟报告

由 `tools/simulate.py` 生成：10000 局，用时 1051.4 秒。引擎是最小实现，只用来检查事件库能不能跑通；没有事件的路径和领域用简化的替身，数值都是【设计】值，不代表游戏平衡。

## 总览

| 指标 | 结果 | 设计目标 |
| --- | --- | --- |
| 每年事件数（平均） | 9.0 | 8–12 |
| 每年抉择数（平均） | 1.83 | 1–3 |
| 每年事件数（只算年初在已写路径的年份） | 9.0 | 8–12 |
| 每年抉择数（只算年初在已写路径的年份） | 1.84 | 1–3 |
| 每局不同事件数（平均） | 63.7 | — |
| 两局之间事件重合度（Jaccard） | 31% | 重复率 < 20% |
| 经历 3 条以上路径的局 | 42.5% | 约 70%（全部路径写完后） |
| 有刑事记录 | 1.6% | — |
| 被裁过 | 25.9% | — |
| 进过大厂的人中被大厂裁过 | 31.5% | 30–35% |
| 35 岁时仍在服刑 | 0.0% | — |
| 35 岁存款中位数 | 318961 元 | — |
| 35 岁存款为负 | 9.2% | — |
| 35 岁心情平均 | 49 | — |

## 路径

| 路径 | 35 岁时在这条路径 | 一生中进入过 |
| --- | --- | --- |
| bigtech | 4.8% | 31.6% |
| crime | 0.0% | 0.9% |
| exam | 0.9% | 6.2% |
| flat | 2.7% | 4.6% |
| public | 0.9% | 1.3% |
| service | 18.4% | 29.7% |
| unemployed | 2.5% | 68.0% |
| whitecollar | 69.8% | 85.7% |

## 从未触发的事件（2 条）

- `bigtech.crisis.options_void`（期权）
- `bigtech.entry.offer_revoked`（意向书被毁）

## 极少触发的事件（< 0.2% 的局，14 条）

- `unemployed.cross.bail_interview`（取保期间面试）：0.0%
- `unemployed.cross.old_friend_returns`（旧朋友又来了）：0.1%
- `bigtech.cross.fake_commute`（背着电脑包出门）：0.1%
- `crime.release.relapse`（复吸 / 复赌）：0.1%
- `crime.overseas.investigated`（回国调查）：0.1%
- `crime.release.second_chance`（愿意给机会的老板）：0.1%
- `crime.cross.bonus_bet`（年终奖那晚）：0.1%
- `crime.release.disclose`（如实报告）：0.1%
- `unemployed.cross.record_sealed`（记录封存了）：0.1%
- `unemployed.cross.after_scam_compound`（被骗出境回来后）：0.1%
- `crime.overseas.silence`（不敢讲）：0.2%
- `crime.cross.age35`（35 岁）：0.2%
- `unemployed.cross.out_of_town_offer`（外地的 offer）：0.2%
- `crime.overseas.rescued`（被解救）：0.2%

## 断掉的连锁

| 目标事件 | 条件不满足 | 超出年龄 | 不存在 |
| --- | --- | --- | --- |
| `housing.big.stock_down` | 3709 | 0 | 0 |
| `family.parents.alone` | 3282 | 0 | 0 |
| `love.meet.first_date` | 2025 | 0 | 0 |
| `service.platform.injury_claim` | 12 | 773 | 0 |
| `crime.case.fired` | 41 | 0 | 0 |
| `crime.prison.partner` | 28 | 0 | 0 |
| `crime.prison.letter` | 20 | 0 | 0 |
| `housing.buy.keys` | 1 | 0 | 0 |

35 岁时还排在队列里没执行的后续事件：1201 个。

## 引擎尚未实现的机制

- 无

## 每条事件的触发率

| 事件 | 种子 | 触发过的局 | 平均每局次数 |
| --- | --- | --- | --- |
| `family.daily.parent_phone` | 父母的手机 | 100.0% | 2.82 |
| `family.parents.checkup` | 体检报告 | 99.8% | 2.52 |
| `love.daily.gift_money` | 份子钱 | 99.3% | 3.92 |
| `family.daily.video_call` | 视频电话 | 91.3% | 3.00 |
| `love.daily.weekend` | 一起过周末 | 90.1% | 3.37 |
| `housing.buy.viewing` | 看房 | 86.8% | 2.58 |
| `family.spring.go_home` | 回家过年 | 86.4% | 3.30 |
| `whitecollar.entry.badge` | 工牌和工位 | 83.6% | 0.84 |
| `love.meet.crush` | 心动 | 83.5% | 1.64 |
| `love.together.meet_parents` | 见家长 | 80.3% | 0.87 |
| `whitecollar.daily.ppt` | 汇报 PPT | 80.3% | 3.75 |
| `family.start.first_salary` | 第一份工资 | 79.3% | 0.79 |
| `whitecollar.daily.reimburse` | 报销 | 78.5% | 2.46 |
| `whitecollar.daily.colleague_wedding` | 同事结婚 | 77.6% | 2.34 |
| `housing.rent.agent_fee` | 中介费 | 74.5% | 1.55 |
| `whitecollar.growth.raise_talk` | 加薪谈判 | 73.8% | 2.52 |
| `housing.rent.raise` | 房东涨租 | 71.1% | 1.47 |
| `family.echo.aging` | 父母变老 | 69.6% | 0.70 |
| `love.meet.first_date` | 第一次约会 | 66.9% | 0.79 |
| `housing.buy.decide` | 买房 | 66.5% | 0.99 |
| `love.wed.proposal` | 求婚 | 62.2% | 0.63 |
| `love.wed.registry` | 领证 | 62.2% | 0.63 |
| `love.wed.wedding` | 婚礼 | 62.2% | 0.63 |
| `whitecollar.entry.first_scold` | 第一次被骂 | 62.0% | 0.62 |
| `whitecollar.entry.party_show` | 年会节目 | 61.9% | 0.62 |
| `love.daily.single_weekend` | 一个人的周末 | 61.2% | 1.20 |
| `family.elder.passing` | 祖辈离世 | 60.8% | 0.81 |
| `housing.rent.flatmate` | 合租室友 | 60.2% | 1.48 |
| `whitecollar.daily.blame` | 背锅 | 58.8% | 0.99 |
| `housing.rent.moving` | 搬家 | 58.5% | 1.05 |
| `unemployed.seek.got_offer` | offer 到手 | 58.3% | 0.81 |
| `love.kids.decide` | 生不生 | 57.1% | 0.85 |
| `whitecollar.growth.job_hop` | 跳槽 | 56.1% | 0.91 |
| `family.daily.siblings` | 兄弟姐妹 | 55.4% | 1.99 |
| `bigtech.entry.offer_flex` | 群里晒 offer | 54.4% | 0.54 |
| `love.blind.ask` | 相亲 | 52.7% | 1.02 |
| `family.push.marry` | 催婚 | 52.6% | 1.39 |
| `love.together.cohabit` | 同居 | 52.3% | 0.68 |
| `family.parents.downpay` | 首付支援 | 52.0% | 0.52 |
| `housing.buy.sign` | 签合同 | 52.0% | 0.52 |
| `housing.rent.first_room` | 第一次找房 | 51.8% | 0.52 |
| `love.wed.bride_price` | 彩礼 | 50.5% | 0.56 |
| `unemployed.gap.relatives` | 亲戚饭局 | 50.4% | 0.74 |
| `whitecollar.daily.mentor` | 带新人 | 49.5% | 1.46 |
| `love.start.long_distance` | 异地恋 | 49.3% | 0.68 |
| `housing.rent.commute` | 通勤 | 46.6% | 1.85 |
| `family.spring.dinner` | 年夜饭 | 46.2% | 0.66 |
| `housing.own.rate_cut` | 房贷利率下调 | 44.7% | 0.45 |
| `whitecollar.growth.promotion` | 升主管 | 43.7% | 0.64 |
| `love.kids.pregnant` | 怀孕 | 43.5% | 0.51 |
| `family.parents.ill` | 父母生病 | 43.1% | 0.59 |
| `family.parents.bill` | 医药费 | 43.1% | 0.59 |
| `whitecollar.growth.transfer` | 调岗 | 41.8% | 0.53 |
| `love.blind.scene` | 相亲现场 | 41.7% | 0.61 |
| `family.spring.rush` | 春运 | 41.3% | 0.55 |
| `housing.rent.solo` | 一个人住 | 41.0% | 0.50 |
| `love.kids.newborn` | 新生儿 | 39.3% | 0.46 |
| `love.kids.childcare` | 带娃 | 39.3% | 0.46 |
| `family.parents.scam` | 防诈骗 | 38.8% | 0.45 |
| `love.kids.first_word` | 孩子开口 | 38.5% | 0.38 |
| `housing.buy.keys` | 交房 | 36.7% | 0.37 |
| `housing.buy.renovation` | 装修 | 36.7% | 0.37 |
| `unemployed.mind.small_joy` | 小确幸 | 35.1% | 0.45 |
| `unemployed.seek.read_no_reply` | 已读不回 | 34.7% | 0.45 |
| `unemployed.seek.mass_apply` | 海投 | 34.4% | 0.44 |
| `love.wed.marital_home` | 婚房 | 33.5% | 0.34 |
| `crime.cross.scammed` | 被骗钱 | 33.0% | 0.33 |
| `whitecollar.echo.age30` | 30 岁的会 | 31.9% | 0.32 |
| `whitecollar.daily.trip` | 出差 | 30.4% | 1.84 |
| `family.parents.ward` | 陪护 | 29.9% | 0.36 |
| `unemployed.seek.lower_bar` | 降低期望 | 29.6% | 0.36 |
| `unemployed.policy.register` | 失业登记 | 29.6% | 0.30 |
| `bigtech.growth.req_change` | 需求改了三版 | 29.0% | 0.85 |
| `housing.rent.partition` | 隔断间 | 28.9% | 0.67 |
| `housing.rent.landlord_sells` | 房东卖房 | 28.4% | 0.33 |
| `service.entry.start` | 注册 | 28.1% | 0.28 |
| `bigtech.growth.pua` | 被 PUA | 27.7% | 0.72 |
| `bigtech.growth.slacking` | 摸鱼 | 27.6% | 0.72 |
| `love.kids.second` | 二胎 | 27.6% | 0.29 |
| `bigtech.growth.anon_forum` | 脉脉 | 27.3% | 0.97 |
| `bigtech.growth.farewell_dinner` | 同事离职饭 | 26.8% | 0.67 |
| `unemployed.gap.skill` | 学技能 | 26.7% | 0.32 |
| `housing.own.price_drop` | 房价跌了 | 26.6% | 0.33 |
| `unemployed.seek.greeting_limit` | 打招呼上限 | 26.6% | 0.32 |
| `whitecollar.daily.checkup` | 体检 | 26.3% | 0.26 |
| `housing.own.prepay` | 提前还贷 | 26.0% | 0.36 |
| `bigtech.echo.old_badge` | 旧工牌 | 25.4% | 0.25 |
| `love.together.breakup` | 分手 | 25.0% | 0.29 |
| `crime.cross.graft_notice_known` | 内部反腐通报 | 24.9% | 0.28 |
| `bigtech.growth.team_building` | 团建 | 24.7% | 0.63 |
| `whitecollar.sales.client_dinner` | 客户饭局 | 24.1% | 0.59 |
| `bigtech.growth.checkup` | 体检 | 23.8% | 0.52 |
| `bigtech.echo.mentor_now` | 导师去向 | 23.2% | 0.23 |
| `bigtech.cross.last_day` | 最后一天 | 22.8% | 0.25 |
| `whitecollar.sales.quota` | 业绩考核 | 22.4% | 0.50 |
| `bigtech.entry.mentor` | 新人导师 | 22.1% | 0.22 |
| `unemployed.mind.self_doubt` | 自我怀疑 | 22.0% | 0.26 |
| `service.daily.crew` | 站点兄弟 | 21.9% | 0.65 |
| `whitecollar.crisis.pay_cut` | 降薪 | 21.7% | 0.22 |
| `unemployed.down.delivery` | 先送外卖 | 21.6% | 0.24 |
| `bigtech.growth.annual_bonus` | 年终奖 | 21.4% | 1.31 |
| `whitecollar.exit.exam` | 想上岸 | 20.9% | 0.21 |
| `housing.rent.deposit` | 押金 | 20.9% | 0.24 |
| `service.daily.bad_review` | 差评 | 20.6% | 0.92 |
| `bigtech.entry.mass_apply` | 海投 | 20.4% | 0.20 |
| `bigtech.growth.reorg` | 组织架构调整 | 20.2% | 0.38 |
| `bigtech.growth.annual_party` | 年会 | 20.2% | 0.71 |
| `housing.buy.hometown` | 回老家买房 | 19.9% | 0.22 |
| `bigtech.growth.neck` | 颈椎 | 19.7% | 0.28 |
| `unemployed.policy.grace_period` | 择业期 | 19.7% | 0.20 |
| `bigtech.growth.stock_vest` | 股票归属 | 19.4% | 0.66 |
| `family.parents.alone` | 一个人扛 | 19.3% | 0.27 |
| `bigtech.growth.promo_defense` | 晋升答辩 | 19.0% | 1.08 |
| `bigtech.growth.promo_result` | 晋升结果 | 19.0% | 1.08 |
| `whitecollar.cross.from_bigtech` | 被叫"大厂来的" | 18.4% | 0.18 |
| `family.parents.move_in` | 接来同住 | 18.3% | 0.18 |
| `bigtech.crisis.downshift` | 降薪跳槽 | 18.1% | 0.18 |
| `bigtech.entry.rote_answers` | 八股文 | 16.9% | 0.17 |
| `whitecollar.crisis.wage_arrears` | 拖欠工资 | 16.8% | 0.19 |
| `whitecollar.crisis.arbitration` | 劳动仲裁 | 16.8% | 0.19 |
| `whitecollar.cross.no_use` | 用不上 | 16.7% | 0.17 |
| `whitecollar.exit.bigtech_interview` | 大厂的面试 | 16.7% | 0.17 |
| `service.daily.family_look` | 家人的眼神 | 16.4% | 0.16 |
| `family.daily.group` | 家族群 | 16.3% | 0.69 |
| `service.rider.water` | 一瓶水 | 16.2% | 0.41 |
| `whitecollar.cross.six_pm` | 下午六点 | 16.0% | 0.16 |
| `whitecollar.growth.hometown_branch` | 回老家分公司 | 15.8% | 0.16 |
| `bigtech.crisis.layoff_rumor` | 裁员风声 | 15.7% | 0.26 |
| `whitecollar.growth.cert` | 考证 | 15.6% | 0.16 |
| `service.daily.classmate` | 遇到同学 | 15.5% | 0.15 |
| `unemployed.policy.file_transfer` | 档案去哪 | 15.2% | 0.15 |
| `love.start.grad_breakup` | 毕业分手 | 15.0% | 0.15 |
| `whitecollar.crisis.laid_off` | 被裁 | 15.0% | 0.16 |
| `service.platform.new_year` | 过年不回家 | 15.0% | 0.29 |
| `unemployed.gap.certificate` | 考证 | 14.8% | 0.16 |
| `unemployed.policy.benefit` | 失业保险 | 14.8% | 0.15 |
| `love.crisis.fight` | 婚姻危机 | 14.6% | 0.16 |
| `bigtech.crisis.side_hustle` | 副业 | 14.4% | 0.14 |
| `service.platform.dispatch` | 系统派单 | 14.1% | 0.34 |
| `service.platform.freedom` | 掌控感 | 14.0% | 0.34 |
| `unemployed.down.savings_low` | 存款见底 | 14.0% | 0.16 |
| `unemployed.down.borrow` | 借钱 | 14.0% | 0.16 |
| `whitecollar.cross.ex_colleague` | 前同事的朋友圈 | 13.7% | 0.14 |
| `service.rider.elevator` | 电梯 | 13.6% | 0.33 |
| `service.rider.storm` | 暴雨单 | 13.6% | 0.49 |
| `whitecollar.growth.politics` | 站队 | 12.9% | 0.17 |
| `love.echo.alone` | 一个人 | 12.8% | 0.13 |
| `unemployed.seek.group_interview` | 群面 | 12.6% | 0.14 |
| `bigtech.growth.late_release` | 凌晨发版 | 12.5% | 0.46 |
| `unemployed.gap.hide_moments` | 屏蔽朋友圈 | 12.4% | 0.12 |
| `bigtech.growth.headhunter` | 猎头电话 | 12.3% | 0.28 |
| `bigtech.crisis.overwork_news` | 猝死新闻 | 12.1% | 0.14 |
| `unemployed.mind.insomnia` | 失眠 | 12.1% | 0.14 |
| `unemployed.seek.gap_question` | 空窗期 | 12.1% | 0.13 |
| `service.platform.rule_change` | 平台规则变了 | 12.0% | 0.28 |
| `bigtech.entry.first_day` | 第一天 | 12.0% | 0.12 |
| `bigtech.growth.oncall` | on-call | 11.9% | 0.35 |
| `family.care.need` | 家里需要人 | 11.9% | 0.12 |
| `bigtech.cross.quit` | 裸辞 | 11.8% | 0.21 |
| `service.platform.insurance` | 社保 | 10.8% | 0.11 |
| `bigtech.crisis.outsource_party` | 外包不能去年会 | 10.6% | 0.52 |
| `unemployed.down.tutoring` | 兼职家教 | 10.4% | 0.11 |
| `unemployed.seek.spring_hire` | 春招补录 | 10.3% | 0.10 |
| `bigtech.growth.perf_review` | 绩效季 | 10.3% | 0.12 |
| `service.store.regular` | 老顾客 | 10.1% | 0.28 |
| `bigtech.crisis.ai_wave` | AI 冲击 | 10.0% | 0.10 |
| `bigtech.crisis.laid_off` | 被优化 | 10.0% | 0.10 |
| `service.growth.promotion` | 店长 | 9.8% | 0.10 |
| `whitecollar.cross.no_return` | 回不去 | 9.8% | 0.10 |
| `housing.big.top_buy` | 高位上车 | 9.8% | 0.10 |
| `bigtech.entry.pick_offer` | 选 offer | 9.7% | 0.10 |
| `unemployed.mind.stay_in` | 不想出门 | 9.7% | 0.11 |
| `unemployed.mind.reach_out` | 求助 | 9.7% | 0.11 |
| `bigtech.entry.outsource_badge` | 外包工牌 | 9.7% | 0.18 |
| `service.store.cat` | 店门口的猫 | 9.3% | 0.09 |
| `unemployed.gap.parents_look` | 父母的眼神 | 9.1% | 0.10 |
| `bigtech.entry.nickname` | 花名 | 9.0% | 0.09 |
| `crime.cross.after_party` | 年会之后 | 8.9% | 0.15 |
| `crime.lure.designated_driver` | 代驾 | 8.9% | 0.15 |
| `unemployed.seek.unpaid_trial` | 无薪试岗 | 8.9% | 0.09 |
| `bigtech.cross.lower_offer` | 开价六成 | 8.8% | 0.09 |
| `bigtech.growth.job_hop` | 跳槽 | 8.8% | 0.14 |
| `unemployed.gap.dorm_group` | 宿舍群 | 8.6% | 0.09 |
| `service.store.kitchen` | 后厨 | 8.5% | 0.24 |
| `service.growth.schedule` | 带新人 | 8.4% | 0.18 |
| `service.cross.resume` | 一边跑一边投 | 8.3% | 0.15 |
| `service.cross.resume_choice` | 简历上写什么 | 8.3% | 0.15 |
| `bigtech.crisis.graft_notice` | 内部反腐通报 | 8.1% | 0.09 |
| `unemployed.seek.connections` | 托关系 | 7.8% | 0.08 |
| `service.daily.former_office` | 前白领 | 7.7% | 0.08 |
| `bigtech.crisis.join_ai` | 转 AI | 7.3% | 0.07 |
| `unemployed.seek.probation_fail` | 试用期没过 | 7.2% | 0.08 |
| `service.cross.drifting` | 跑着跑着 | 7.2% | 0.07 |
| `whitecollar.cross.jargon` | 黑话不通 | 7.2% | 0.07 |
| `whitecollar.cross.pace` | 节奏 | 7.2% | 0.07 |
| `service.growth.open_shop` | 攒钱开店 | 7.2% | 0.07 |
| `whitecollar.growth.cert_pass` | 证书通过 | 7.2% | 0.21 |
| `unemployed.gap.decide` | 决定 gap | 7.1% | 0.07 |
| `bigtech.crisis.tech_or_mgmt` | 技术还是管理 | 7.1% | 0.07 |
| `bigtech.cross.halo` | 光环 | 6.8% | 0.07 |
| `service.growth.switch_job` | 换个活 | 6.7% | 0.07 |
| `service.platform.crash` | 摔车 | 6.7% | 0.09 |
| `unemployed.late.mortgage` | 房贷 | 6.6% | 0.07 |
| `whitecollar.crisis.foreign_exit` | 外企中国区 | 6.4% | 0.06 |
| `unemployed.down.move_home` | 退租回家 | 6.3% | 0.06 |
| `bigtech.growth.near_office` | 后厂村 / 西二旗 | 6.2% | 0.06 |
| `love.crisis.cooling` | 离婚冷静期 | 6.0% | 0.06 |
| `service.cross.back_to_office` | 回到写字楼 | 6.0% | 0.06 |
| `bigtech.growth.office_romance` | 同事恋爱 | 5.8% | 0.06 |
| `service.daily.video_call` | 孩子的视频 | 5.7% | 0.07 |
| `bigtech.growth.first_incident` | 第一次线上事故 | 5.6% | 0.06 |
| `bigtech.echo.ten_years` | 十年司龄 | 5.6% | 0.06 |
| `housing.big.near_office` | 公司附近 | 5.2% | 0.14 |
| `bigtech.crisis.arbitration` | 仲裁结果 | 5.0% | 0.05 |
| `unemployed.seek.training_loan` | 培训贷陷阱 | 5.0% | 0.05 |
| `bigtech.echo.birthday_desk` | 35 岁生日在工位 | 4.8% | 0.05 |
| `service.rider.first_order` | 第一单 | 4.7% | 0.05 |
| `family.care.fulltime` | 全职照护 | 4.6% | 0.05 |
| `bigtech.crisis.deliver_news` | 谈下属 | 4.5% | 0.05 |
| `unemployed.policy.follow_up` | 一对一帮扶 | 4.4% | 0.05 |
| `whitecollar.entry.rotation` | 管培轮岗 | 4.4% | 0.06 |
| `housing.big.stock_down` | 用股票付首付 | 4.3% | 0.04 |
| `service.cross.that_year` | 那一年 | 4.3% | 0.04 |
| `unemployed.late.age_echo` | 年龄回响 | 4.2% | 0.04 |
| `unemployed.gap.fake_work` | 假装上班 | 4.2% | 0.05 |
| `unemployed.cross.that_message` | 那条群消息 | 4.2% | 0.04 |
| `unemployed.late.age_bar` | 年龄门槛 | 4.1% | 0.04 |
| `bigtech.crisis.go_home` | 回老家 | 4.0% | 0.04 |
| `bigtech.cross.dorm_group` | 宿舍群 | 4.0% | 0.04 |
| `family.care.allowance` | 父母的工资 | 3.8% | 0.09 |
| `service.growth.reapply` | 重新求职 | 3.8% | 0.04 |
| `bigtech.cross.referral` | 前同事内推 | 3.7% | 0.04 |
| `family.care.two_views` | 两种眼光 | 3.6% | 0.08 |
| `bigtech.growth.internal_transfer` | 内部转岗 | 3.5% | 0.05 |
| `unemployed.cross.gamble_to_survive` | 翻本 | 3.5% | 0.03 |
| `crime.cross.colleague_taken` | 同事被带走 | 3.4% | 0.03 |
| `whitecollar.cross.downshift` | 降级求稳 | 3.3% | 0.03 |
| `bigtech.cross.severance_gone` | N+1 花完了 | 3.2% | 0.03 |
| `unemployed.down.move_city` | 换城市 | 3.1% | 0.03 |
| `unemployed.down.flyers` | 发传单 | 3.1% | 0.03 |
| `service.exit.hometown` | 回老家 | 3.0% | 0.03 |
| `service.courier.peak` | 快递旺季 | 3.0% | 0.15 |
| `unemployed.late.ride_hailing` | 跑网约车 | 2.9% | 0.03 |
| `service.store.closed` | 门店关了 | 2.8% | 0.03 |
| `unemployed.cross.classmate_project` | 老同学的项目 | 2.8% | 0.03 |
| `bigtech.cross.alumni_group` | 毕业生联谊群 | 2.6% | 0.03 |
| `bigtech.crisis.mortgage_layoff` | 房贷 + 裁员 | 2.6% | 0.03 |
| `service.cross.interviewer` | 面试官的反应 | 2.5% | 0.03 |
| `service.owner.daily` | 小店的一年 | 2.5% | 0.08 |
| `bigtech.cross.explain_gap` | 空窗期怎么说 | 2.4% | 0.02 |
| `crime.lure.roommate_warns` | 室友提醒 | 2.4% | 0.02 |
| `crime.case.summoned` | 被传唤 | 2.3% | 0.03 |
| `crime.case.tell_family` | 告诉家里 | 2.3% | 0.03 |
| `bigtech.entry.algo_test` | 算法题 | 2.3% | 0.02 |
| `crime.case.fired` | 被开除 | 2.1% | 0.02 |
| `bigtech.cross.fired_no_pay` | 违纪没有赔偿 | 2.1% | 0.02 |
| `bigtech.cross.severance` | 赔偿到账 | 1.9% | 0.02 |
| `bigtech.cross.insurance_gap` | 社保断缴 | 1.9% | 0.02 |
| `bigtech.crisis.outsource_convert` | 外包转正 | 1.9% | 0.02 |
| `crime.lure.dui_stop` | 只喝了一点 | 1.8% | 0.02 |
| `bigtech.cross.parents_unaware` | 父母还不知道 | 1.8% | 0.02 |
| `family.care.after` | 父母走了以后 | 1.7% | 0.02 |
| `bigtech.cross.stack_changed` | 技术栈变了 | 1.7% | 0.02 |
| `crime.case.bail` | 取保 | 1.7% | 0.02 |
| `crime.case.verdict` | 判决 | 1.6% | 0.02 |
| `crime.release.restart` | 重新开始 | 1.6% | 0.02 |
| `crime.cross.returned_envelope` | 当年退回的信封 | 1.4% | 0.01 |
| `crime.lure.pyramid` | 外地考察 | 1.4% | 0.01 |
| `bigtech.crisis.age_resume` | 35 岁简历 | 1.4% | 0.01 |
| `crime.cross.roommate_arrested` | 室友出事 | 1.3% | 0.01 |
| `crime.case.restitution` | 退赃 | 1.3% | 0.01 |
| `unemployed.cross.daily_cash_job` | 日结兼职 | 1.3% | 0.01 |
| `crime.cross.lookup_user` | 帮忙查个人 | 1.2% | 0.01 |
| `housing.own.default_edge` | 断供边缘 | 1.2% | 0.01 |
| `crime.case.parents_react` | 父母的反应 | 1.1% | 0.01 |
| `unemployed.cross.no_ride_hailing` | 网约车也不行 | 1.0% | 0.01 |
| `crime.release.civil_closed` | 考公无缘 | 1.0% | 0.01 |
| `crime.cross.roommate_named` | 室友被通报 | 1.0% | 0.01 |
| `service.owner.close` | 小店关门 | 0.9% | 0.01 |
| `unemployed.late.hide_from_spouse` | 瞒着家里 | 0.9% | 0.01 |
| `crime.overseas.high_pay` | 高薪 offer | 0.9% | 0.01 |
| `service.owner.hard_times` | 生意难做 | 0.9% | 0.01 |
| `service.courier.back` | 腰伤 | 0.9% | 0.01 |
| `crime.prison.first_month` | 第一个月 | 0.9% | 0.01 |
| `crime.prison.visit` | 探视 | 0.9% | 0.01 |
| `unemployed.cross.after_dismissal` | 被开除之后 | 0.9% | 0.01 |
| `crime.cross.vendor_dinner` | 供应商的饭局 | 0.8% | 0.01 |
| `unemployed.cross.loan_shark` | 网贷催收 | 0.8% | 0.01 |
| `crime.case.probation` | 缓刑 | 0.8% | 0.01 |
| `service.driver.night` | 夜班司机 | 0.8% | 0.01 |
| `bigtech.cross.noncompete` | 竞业限制 | 0.8% | 0.01 |
| `crime.release.no_record_cert` | 无犯罪记录证明 | 0.8% | 0.01 |
| `housing.big.sell` | 卖房 | 0.8% | 0.01 |
| `service.owner.good_year` | 上了榜 | 0.8% | 0.01 |
| `bigtech.cross.back_as_contractor` | 以外包身份回来 | 0.8% | 0.01 |
| `crime.release.out` | 出狱 | 0.8% | 0.01 |
| `service.platform.injury_claim` | 职业伤害保障 | 0.7% | 0.01 |
| `unemployed.policy.internship` | 就业见习 | 0.7% | 0.01 |
| `bigtech.cross.passenger_talk` | 乘客聊裁员 | 0.7% | 0.01 |
| `service.driver.passenger` | 乘客的故事 | 0.6% | 0.01 |
| `crime.prison.skill` | 学手艺 | 0.6% | 0.01 |
| `crime.prison.partner` | 伴侣 | 0.6% | 0.01 |
| `unemployed.cross.roommate_stop` | 室友劝住 | 0.6% | 0.01 |
| `unemployed.gap.backpacking` | 穷游 | 0.6% | 0.01 |
| `crime.release.dorm_group` | 宿舍群 | 0.6% | 0.01 |
| `crime.cross.offer_withdrawn` | 背调撤回 offer | 0.6% | 0.01 |
| `crime.case.admin_penalty_pyramid` | 被传唤 | 0.6% | 0.01 |
| `bigtech.cross.boomerang` | 老东家回流 | 0.5% | 0.01 |
| `crime.lure.phone_rings` | 手机一响 | 0.5% | 0.01 |
| `bigtech.cross.late_entry` | 落榜一年后 | 0.5% | 0.00 |
| `love.public.insist` | 一定要体制内 | 0.5% | 0.00 |
| `crime.release.sealed` | 治安处罚被封存 | 0.4% | 0.00 |
| `service.driver.lost_item` | 失物 | 0.4% | 0.00 |
| `crime.case.surrender` | 主动投案 | 0.4% | 0.00 |
| `crime.cross.lend_to_released` | 帮不帮 | 0.4% | 0.00 |
| `crime.lure.card_lent` | 兼职广告 | 0.4% | 0.00 |
| `love.public.wed_year` | 上岸那年 | 0.4% | 0.00 |
| `unemployed.cross.that_year` | 那一年 | 0.4% | 0.00 |
| `love.public.bonus` | 相亲加分 | 0.4% | 0.01 |
| `crime.cross.shady_gig` | 涉罪的私活 | 0.4% | 0.00 |
| `unemployed.cross.resettlement` | 安置帮教 | 0.4% | 0.00 |
| `crime.lure.card_frozen` | 卡被冻了 | 0.3% | 0.00 |
| `crime.cross.check_passed` | 背调过了 | 0.3% | 0.00 |
| `unemployed.cross.disclose_record` | 如实报告 | 0.3% | 0.00 |
| `unemployed.seek.overseas_offer` | 境外高薪 | 0.3% | 0.00 |
| `crime.prison.letter` | 室友的信 | 0.3% | 0.00 |
| `crime.case.admin_penalty_gambling` | 被传唤 | 0.3% | 0.00 |
| `unemployed.cross.stay_home_after` | 父母说先在家待着 | 0.2% | 0.00 |
| `unemployed.cross.frozen_while_jobless` | 失业中被冻卡 | 0.2% | 0.00 |
| `crime.cross.small_company` | 小公司收留 | 0.2% | 0.00 |
| `crime.cross.audit_talk` | 内审约谈 | 0.2% | 0.00 |
| `crime.cross.on_the_list` | 通报名单 | 0.2% | 0.00 |
| `crime.cross.no_severance` | 没有赔偿 | 0.2% | 0.00 |
| `crime.overseas.passport` | 证件被收 | 0.2% | 0.00 |
| `crime.overseas.missing` | 失联 | 0.2% | 0.00 |
| `crime.overseas.rescued` | 被解救 | 0.2% | 0.00 |
| `crime.cross.age35` | 35 岁 | 0.2% | 0.00 |
| `unemployed.cross.out_of_town_offer` | 外地的 offer | 0.2% | 0.00 |
| `crime.overseas.silence` | 不敢讲 | 0.2% | 0.00 |
| `unemployed.cross.record_sealed` | 记录封存了 | 0.1% | 0.00 |
| `unemployed.cross.after_scam_compound` | 被骗出境回来后 | 0.1% | 0.00 |
| `crime.release.disclose` | 如实报告 | 0.1% | 0.00 |
| `crime.release.second_chance` | 愿意给机会的老板 | 0.1% | 0.00 |
| `crime.cross.bonus_bet` | 年终奖那晚 | 0.1% | 0.00 |
| `crime.release.relapse` | 复吸 / 复赌 | 0.1% | 0.00 |
| `crime.overseas.investigated` | 回国调查 | 0.1% | 0.00 |
| `bigtech.cross.fake_commute` | 背着电脑包出门 | 0.1% | 0.00 |
| `unemployed.cross.old_friend_returns` | 旧朋友又来了 | 0.1% | 0.00 |
| `unemployed.cross.bail_interview` | 取保期间面试 | 0.0% | 0.00 |
| `bigtech.crisis.options_void` | 期权 | 0.0% | 0.00 |
| `bigtech.entry.offer_revoked` | 意向书被毁 | 0.0% | 0.00 |
