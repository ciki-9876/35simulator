# 模拟报告

由 `tools/simulate.py` 生成：10000 局，用时 664.4 秒。引擎是最小实现，只用来检查事件库能不能跑通；没有事件的路径和领域用简化的替身，数值都是【设计】值，不代表游戏平衡。

## 总览

| 指标 | 结果 | 设计目标 |
| --- | --- | --- |
| 每年事件数（平均） | 8.9 | 8–12 |
| 每年抉择数（平均） | 1.83 | 1–3 |
| 每年事件数（只算年初在已写路径的年份） | 8.9 | 8–12 |
| 每年抉择数（只算年初在已写路径的年份） | 1.84 | 1–3 |
| 每局不同事件数（平均） | 63.6 | — |
| 两局之间事件重合度（Jaccard） | 31% | 重复率 < 20% |
| 经历 3 条以上路径的局 | 42.8% | 约 70%（全部路径写完后） |
| 有刑事记录 | 1.8% | — |
| 被裁过 | 27.4% | — |
| 进过大厂的人中被大厂裁过 | 33.5% | 30–35% |
| 35 岁时仍在服刑 | 0.1% | — |
| 35 岁存款中位数 | 324294 元 | — |
| 35 岁存款为负 | 8.9% | — |
| 35 岁心情平均 | 48 | — |

## 路径

| 路径 | 35 岁时在这条路径 | 一生中进入过 |
| --- | --- | --- |
| bigtech | 4.5% | 31.1% |
| crime | 0.1% | 0.9% |
| exam | 1.0% | 6.4% |
| flat | 2.6% | 4.6% |
| public | 0.8% | 1.2% |
| service | 17.9% | 29.8% |
| unemployed | 2.9% | 68.9% |
| whitecollar | 70.1% | 86.0% |

## 从未触发的事件（2 条）

- `bigtech.crisis.options_void`（期权）
- `bigtech.entry.offer_revoked`（意向书被毁）

## 极少触发的事件（< 0.2% 的局，12 条）

- `crime.release.second_chance`（愿意给机会的老板）：0.1%
- `crime.cross.bonus_bet`（年终奖那晚）：0.1%
- `bigtech.cross.fake_commute`（背着电脑包出门）：0.1%
- `crime.release.relapse`（复吸 / 复赌）：0.1%
- `unemployed.cross.old_friend_returns`（旧朋友又来了）：0.1%
- `unemployed.cross.after_scam_compound`（被骗出境回来后）：0.1%
- `unemployed.cross.record_sealed`（记录封存了）：0.1%
- `crime.overseas.investigated`（回国调查）：0.2%
- `unemployed.cross.bail_interview`（取保期间面试）：0.2%
- `crime.case.admin_penalty_gambling`（被传唤）：0.2%
- `unemployed.cross.out_of_town_offer`（外地的 offer）：0.2%
- `crime.cross.small_company`（小公司收留）：0.2%

## 断掉的连锁

| 目标事件 | 条件不满足 | 超出年龄 | 不存在 |
| --- | --- | --- | --- |
| `housing.big.stock_down` | 3726 | 0 | 0 |
| `family.parents.alone` | 3271 | 0 | 0 |
| `love.meet.first_date` | 1993 | 0 | 0 |
| `service.platform.injury_claim` | 17 | 738 | 0 |
| `crime.case.fired` | 78 | 0 | 0 |
| `crime.prison.partner` | 39 | 0 | 0 |
| `love.kids.pregnant` | 30 | 0 | 0 |
| `crime.prison.letter` | 26 | 0 | 0 |
| `housing.buy.keys` | 1 | 0 | 0 |

35 岁时还排在队列里没执行的后续事件：1793 个。

## 引擎尚未实现的机制

- 无

## 每条事件的触发率

| 事件 | 种子 | 触发过的局 | 平均每局次数 |
| --- | --- | --- | --- |
| `family.daily.parent_phone` | 父母的手机 | 100.0% | 2.86 |
| `family.parents.checkup` | 体检报告 | 99.9% | 2.57 |
| `love.daily.gift_money` | 份子钱 | 91.9% | 2.40 |
| `family.daily.video_call` | 视频电话 | 91.7% | 3.10 |
| `love.daily.weekend` | 一起过周末 | 90.1% | 3.46 |
| `housing.buy.viewing` | 看房 | 87.7% | 2.63 |
| `family.spring.go_home` | 回家过年 | 87.1% | 3.34 |
| `whitecollar.entry.badge` | 工牌和工位 | 84.0% | 0.84 |
| `love.meet.crush` | 心动 | 83.4% | 1.63 |
| `whitecollar.daily.ppt` | 汇报 PPT | 81.2% | 3.85 |
| `love.together.meet_parents` | 见家长 | 80.1% | 0.87 |
| `whitecollar.daily.reimburse` | 报销 | 79.4% | 2.56 |
| `family.start.first_salary` | 第一份工资 | 79.2% | 0.79 |
| `whitecollar.daily.colleague_wedding` | 同事结婚 | 78.2% | 2.41 |
| `housing.rent.agent_fee` | 中介费 | 77.1% | 1.66 |
| `whitecollar.growth.raise_talk` | 加薪谈判 | 74.5% | 2.58 |
| `housing.rent.raise` | 房东涨租 | 72.5% | 1.50 |
| `family.echo.aging` | 父母变老 | 70.0% | 0.70 |
| `housing.buy.decide` | 买房 | 66.4% | 0.98 |
| `love.meet.first_date` | 第一次约会 | 65.8% | 0.78 |
| `whitecollar.entry.first_scold` | 第一次被骂 | 63.3% | 0.63 |
| `love.daily.single_weekend` | 一个人的周末 | 62.6% | 1.25 |
| `love.wed.proposal` | 求婚 | 62.2% | 0.63 |
| `love.wed.registry` | 领证 | 62.2% | 0.63 |
| `love.wed.wedding` | 婚礼 | 62.2% | 0.63 |
| `housing.rent.flatmate` | 合租室友 | 61.1% | 1.57 |
| `housing.rent.moving` | 搬家 | 60.8% | 1.09 |
| `family.elder.passing` | 祖辈离世 | 60.1% | 0.80 |
| `unemployed.seek.got_offer` | offer 到手 | 59.8% | 0.82 |
| `whitecollar.daily.blame` | 背锅 | 59.0% | 1.00 |
| `love.kids.decide` | 生不生 | 57.0% | 0.83 |
| `whitecollar.growth.job_hop` | 跳槽 | 56.6% | 0.90 |
| `bigtech.entry.offer_flex` | 群里晒 offer | 56.5% | 0.57 |
| `family.daily.siblings` | 兄弟姐妹 | 54.9% | 2.04 |
| `love.blind.ask` | 相亲 | 52.6% | 1.01 |
| `unemployed.gap.relatives` | 亲戚饭局 | 52.6% | 0.77 |
| `family.push.marry` | 催婚 | 52.4% | 1.38 |
| `family.parents.downpay` | 首付支援 | 52.2% | 0.52 |
| `housing.buy.sign` | 签合同 | 52.2% | 0.52 |
| `housing.rent.first_room` | 第一次找房 | 52.2% | 0.52 |
| `whitecollar.daily.mentor` | 带新人 | 51.6% | 1.55 |
| `love.together.cohabit` | 同居 | 51.5% | 0.67 |
| `love.start.long_distance` | 异地恋 | 50.0% | 0.72 |
| `love.wed.bride_price` | 彩礼 | 50.0% | 0.56 |
| `housing.rent.commute` | 通勤 | 48.5% | 2.03 |
| `family.spring.dinner` | 年夜饭 | 46.9% | 0.67 |
| `whitecollar.growth.promotion` | 升主管 | 45.6% | 0.65 |
| `housing.own.rate_cut` | 房贷利率下调 | 44.8% | 0.45 |
| `family.parents.ill` | 父母生病 | 43.8% | 0.60 |
| `family.parents.bill` | 医药费 | 43.8% | 0.60 |
| `love.kids.pregnant` | 怀孕 | 42.4% | 0.48 |
| `housing.rent.solo` | 一个人住 | 42.1% | 0.52 |
| `love.blind.scene` | 相亲现场 | 41.8% | 0.61 |
| `whitecollar.growth.transfer` | 调岗 | 41.2% | 0.52 |
| `family.spring.rush` | 春运 | 40.7% | 0.55 |
| `love.kids.newborn` | 新生儿 | 39.6% | 0.44 |
| `family.parents.scam` | 防诈骗 | 39.0% | 0.46 |
| `love.kids.childcare` | 带娃 | 38.0% | 0.42 |
| `whitecollar.entry.party_show` | 年会节目 | 37.3% | 0.37 |
| `housing.buy.keys` | 交房 | 36.9% | 0.37 |
| `housing.buy.renovation` | 装修 | 36.9% | 0.37 |
| `unemployed.seek.mass_apply` | 海投 | 35.7% | 0.46 |
| `unemployed.seek.read_no_reply` | 已读不回 | 35.6% | 0.46 |
| `love.kids.first_word` | 孩子开口 | 35.3% | 0.39 |
| `unemployed.mind.small_joy` | 小确幸 | 35.2% | 0.46 |
| `love.wed.marital_home` | 婚房 | 33.5% | 0.34 |
| `whitecollar.echo.age30` | 30 岁的会 | 33.5% | 0.33 |
| `crime.cross.scammed` | 被骗钱 | 32.9% | 0.33 |
| `whitecollar.daily.trip` | 出差 | 30.9% | 1.91 |
| `housing.rent.partition` | 隔断间 | 30.9% | 0.54 |
| `unemployed.seek.lower_bar` | 降低期望 | 29.8% | 0.37 |
| `family.parents.ward` | 陪护 | 29.8% | 0.36 |
| `unemployed.policy.register` | 失业登记 | 29.7% | 0.30 |
| `housing.rent.landlord_sells` | 房东卖房 | 28.6% | 0.33 |
| `bigtech.growth.req_change` | 需求改了三版 | 28.2% | 0.86 |
| `service.entry.start` | 注册 | 28.2% | 0.28 |
| `unemployed.seek.greeting_limit` | 打招呼上限 | 27.8% | 0.34 |
| `bigtech.growth.pua` | 被 PUA | 27.5% | 0.73 |
| `unemployed.gap.skill` | 学技能 | 27.3% | 0.33 |
| `bigtech.growth.slacking` | 摸鱼 | 27.2% | 0.73 |
| `whitecollar.daily.checkup` | 体检 | 26.9% | 0.27 |
| `housing.own.price_drop` | 房价跌了 | 26.8% | 0.33 |
| `bigtech.growth.anon_forum` | 脉脉 | 26.6% | 1.00 |
| `bigtech.growth.farewell_dinner` | 同事离职饭 | 26.3% | 0.68 |
| `housing.own.prepay` | 提前还贷 | 26.2% | 0.37 |
| `love.together.breakup` | 分手 | 25.2% | 0.29 |
| `bigtech.echo.old_badge` | 旧工牌 | 24.8% | 0.25 |
| `crime.cross.graft_notice_known` | 内部反腐通报 | 24.8% | 0.28 |
| `bigtech.growth.team_building` | 团建 | 24.4% | 0.66 |
| `whitecollar.sales.client_dinner` | 客户饭局 | 23.9% | 0.60 |
| `bigtech.growth.checkup` | 体检 | 23.2% | 0.51 |
| `bigtech.echo.mentor_now` | 导师去向 | 23.1% | 0.23 |
| `whitecollar.sales.quota` | 业绩考核 | 22.8% | 0.51 |
| `unemployed.mind.self_doubt` | 自我怀疑 | 22.7% | 0.27 |
| `bigtech.cross.last_day` | 最后一天 | 22.4% | 0.24 |
| `service.daily.crew` | 站点兄弟 | 22.4% | 0.69 |
| `whitecollar.exit.exam` | 想上岸 | 22.3% | 0.22 |
| `bigtech.entry.mentor` | 新人导师 | 22.1% | 0.22 |
| `whitecollar.crisis.pay_cut` | 降薪 | 21.8% | 0.22 |
| `love.kids.second` | 二胎 | 21.7% | 0.22 |
| `bigtech.entry.mass_apply` | 海投 | 21.5% | 0.22 |
| `unemployed.down.delivery` | 先送外卖 | 21.5% | 0.24 |
| `housing.rent.deposit` | 押金 | 21.3% | 0.24 |
| `service.daily.bad_review` | 差评 | 21.0% | 0.98 |
| `bigtech.growth.annual_bonus` | 年终奖 | 20.3% | 1.24 |
| `housing.buy.hometown` | 回老家买房 | 20.1% | 0.22 |
| `bigtech.growth.neck` | 颈椎 | 19.9% | 0.30 |
| `family.parents.alone` | 一个人扛 | 19.9% | 0.27 |
| `unemployed.policy.grace_period` | 择业期 | 19.7% | 0.20 |
| `bigtech.growth.reorg` | 组织架构调整 | 19.6% | 0.37 |
| `bigtech.growth.annual_party` | 年会 | 19.0% | 0.68 |
| `whitecollar.cross.from_bigtech` | 被叫"大厂来的" | 18.9% | 0.19 |
| `bigtech.growth.stock_vest` | 股票归属 | 18.6% | 0.62 |
| `bigtech.growth.promo_defense` | 晋升答辩 | 18.2% | 1.04 |
| `bigtech.growth.promo_result` | 晋升结果 | 18.2% | 1.04 |
| `family.parents.move_in` | 接来同住 | 18.0% | 0.18 |
| `bigtech.crisis.downshift` | 降薪跳槽 | 17.6% | 0.18 |
| `unemployed.policy.file_transfer` | 档案去哪 | 17.5% | 0.17 |
| `whitecollar.crisis.wage_arrears` | 拖欠工资 | 17.4% | 0.20 |
| `whitecollar.crisis.arbitration` | 劳动仲裁 | 17.4% | 0.20 |
| `whitecollar.cross.no_use` | 用不上 | 17.0% | 0.17 |
| `service.daily.family_look` | 家人的眼神 | 16.9% | 0.17 |
| `bigtech.entry.rote_answers` | 八股文 | 16.8% | 0.17 |
| `whitecollar.growth.hometown_branch` | 回老家分公司 | 16.8% | 0.17 |
| `whitecollar.exit.bigtech_interview` | 大厂的面试 | 16.4% | 0.16 |
| `service.daily.classmate` | 遇到同学 | 16.3% | 0.16 |
| `whitecollar.growth.cert` | 考证 | 16.2% | 0.16 |
| `whitecollar.cross.six_pm` | 下午六点 | 16.0% | 0.16 |
| `service.rider.water` | 一瓶水 | 16.0% | 0.43 |
| `whitecollar.crisis.laid_off` | 被裁 | 15.9% | 0.17 |
| `family.daily.group` | 家族群 | 15.8% | 0.46 |
| `unemployed.gap.certificate` | 考证 | 15.5% | 0.16 |
| `bigtech.crisis.layoff_rumor` | 裁员风声 | 15.4% | 0.25 |
| `love.start.grad_breakup` | 毕业分手 | 15.3% | 0.15 |
| `service.platform.new_year` | 过年不回家 | 14.9% | 0.29 |
| `unemployed.policy.benefit` | 失业保险 | 14.7% | 0.15 |
| `love.crisis.fight` | 婚姻危机 | 14.5% | 0.16 |
| `service.platform.freedom` | 掌控感 | 14.2% | 0.35 |
| `bigtech.crisis.side_hustle` | 副业 | 14.1% | 0.14 |
| `service.platform.dispatch` | 系统派单 | 14.0% | 0.35 |
| `unemployed.down.savings_low` | 存款见底 | 14.0% | 0.16 |
| `unemployed.down.borrow` | 借钱 | 14.0% | 0.16 |
| `whitecollar.cross.ex_colleague` | 前同事的朋友圈 | 13.8% | 0.14 |
| `service.rider.elevator` | 电梯 | 13.5% | 0.34 |
| `unemployed.seek.group_interview` | 群面 | 13.1% | 0.14 |
| `whitecollar.growth.politics` | 站队 | 13.0% | 0.17 |
| `unemployed.mind.insomnia` | 失眠 | 12.8% | 0.15 |
| `love.echo.alone` | 一个人 | 12.6% | 0.13 |
| `unemployed.seek.gap_question` | 空窗期 | 12.5% | 0.14 |
| `unemployed.gap.hide_moments` | 屏蔽朋友圈 | 12.5% | 0.12 |
| `bigtech.growth.headhunter` | 猎头电话 | 12.0% | 0.26 |
| `bigtech.crisis.overwork_news` | 猝死新闻 | 11.9% | 0.14 |
| `family.care.need` | 家里需要人 | 11.9% | 0.12 |
| `bigtech.growth.late_release` | 凌晨发版 | 11.8% | 0.46 |
| `bigtech.entry.first_day` | 第一天 | 11.8% | 0.12 |
| `bigtech.cross.quit` | 裸辞 | 11.6% | 0.21 |
| `service.platform.rule_change` | 平台规则变了 | 11.6% | 0.26 |
| `bigtech.growth.oncall` | on-call | 11.4% | 0.34 |
| `service.store.regular` | 老顾客 | 10.8% | 0.31 |
| `unemployed.down.tutoring` | 兼职家教 | 10.5% | 0.12 |
| `service.rider.storm` | 暴雨单 | 10.4% | 0.25 |
| `bigtech.crisis.laid_off` | 被优化 | 10.4% | 0.11 |
| `service.platform.insurance` | 社保 | 10.3% | 0.10 |
| `bigtech.crisis.outsource_party` | 外包不能去年会 | 10.3% | 0.52 |
| `bigtech.entry.pick_offer` | 选 offer | 10.1% | 0.10 |
| `service.store.cat` | 店门口的猫 | 10.1% | 0.10 |
| `service.growth.promotion` | 店长 | 9.9% | 0.10 |
| `unemployed.seek.spring_hire` | 春招补录 | 9.9% | 0.10 |
| `housing.big.top_buy` | 高位上车 | 9.7% | 0.10 |
| `unemployed.mind.stay_in` | 不想出门 | 9.7% | 0.12 |
| `unemployed.mind.reach_out` | 求助 | 9.7% | 0.12 |
| `bigtech.growth.perf_review` | 绩效季 | 9.6% | 0.11 |
| `unemployed.gap.parents_look` | 父母的眼神 | 9.5% | 0.11 |
| `whitecollar.cross.no_return` | 回不去 | 9.5% | 0.09 |
| `bigtech.crisis.ai_wave` | AI 冲击 | 9.4% | 0.09 |
| `bigtech.entry.outsource_badge` | 外包工牌 | 9.3% | 0.18 |
| `service.growth.schedule` | 带新人 | 8.8% | 0.20 |
| `crime.cross.after_party` | 年会之后 | 8.8% | 0.14 |
| `crime.lure.designated_driver` | 代驾 | 8.8% | 0.14 |
| `service.store.kitchen` | 后厨 | 8.8% | 0.26 |
| `unemployed.seek.unpaid_trial` | 无薪试岗 | 8.7% | 0.09 |
| `service.cross.resume` | 一边跑一边投 | 8.6% | 0.14 |
| `service.cross.resume_choice` | 简历上写什么 | 8.6% | 0.14 |
| `unemployed.gap.dorm_group` | 宿舍群 | 8.4% | 0.09 |
| `bigtech.growth.job_hop` | 跳槽 | 8.4% | 0.13 |
| `bigtech.cross.lower_offer` | 开价六成 | 8.4% | 0.08 |
| `bigtech.entry.nickname` | 花名 | 8.4% | 0.08 |
| `unemployed.seek.connections` | 托关系 | 8.3% | 0.08 |
| `service.daily.former_office` | 前白领 | 8.1% | 0.08 |
| `unemployed.gap.decide` | 决定 gap | 7.5% | 0.08 |
| `whitecollar.growth.cert_pass` | 证书通过 | 7.5% | 0.21 |
| `service.growth.open_shop` | 攒钱开店 | 7.4% | 0.07 |
| `bigtech.crisis.graft_notice` | 内部反腐通报 | 7.4% | 0.08 |
| `love.crisis.cooling` | 离婚冷静期 | 7.2% | 0.07 |
| `service.cross.drifting` | 跑着跑着 | 7.0% | 0.07 |
| `unemployed.seek.probation_fail` | 试用期没过 | 6.9% | 0.07 |
| `whitecollar.cross.jargon` | 黑话不通 | 6.8% | 0.07 |
| `whitecollar.cross.pace` | 节奏 | 6.8% | 0.07 |
| `bigtech.crisis.tech_or_mgmt` | 技术还是管理 | 6.8% | 0.07 |
| `service.growth.switch_job` | 换个活 | 6.7% | 0.08 |
| `bigtech.cross.halo` | 光环 | 6.7% | 0.07 |
| `bigtech.crisis.join_ai` | 转 AI | 6.6% | 0.07 |
| `unemployed.late.mortgage` | 房贷 | 6.6% | 0.07 |
| `unemployed.down.move_home` | 退租回家 | 6.5% | 0.06 |
| `service.cross.back_to_office` | 回到写字楼 | 6.3% | 0.06 |
| `whitecollar.crisis.foreign_exit` | 外企中国区 | 6.1% | 0.06 |
| `service.platform.crash` | 摔车 | 6.1% | 0.08 |
| `bigtech.growth.near_office` | 后厂村 / 西二旗 | 6.0% | 0.06 |
| `bigtech.growth.office_romance` | 同事恋爱 | 5.4% | 0.05 |
| `housing.big.near_office` | 公司附近 | 5.4% | 0.05 |
| `bigtech.echo.ten_years` | 十年司龄 | 5.3% | 0.05 |
| `bigtech.crisis.arbitration` | 仲裁结果 | 5.2% | 0.05 |
| `bigtech.growth.first_incident` | 第一次线上事故 | 4.9% | 0.05 |
| `whitecollar.entry.rotation` | 管培轮岗 | 4.8% | 0.07 |
| `service.rider.first_order` | 第一单 | 4.8% | 0.05 |
| `service.daily.video_call` | 孩子的视频 | 4.8% | 0.06 |
| `service.cross.that_year` | 那一年 | 4.8% | 0.05 |
| `bigtech.crisis.deliver_news` | 谈下属 | 4.6% | 0.05 |
| `family.care.fulltime` | 全职照护 | 4.6% | 0.05 |
| `unemployed.late.age_echo` | 年龄回响 | 4.6% | 0.05 |
| `bigtech.echo.birthday_desk` | 35 岁生日在工位 | 4.5% | 0.05 |
| `unemployed.cross.that_message` | 那条群消息 | 4.5% | 0.04 |
| `unemployed.seek.training_loan` | 培训贷陷阱 | 4.5% | 0.04 |
| `unemployed.late.age_bar` | 年龄门槛 | 4.4% | 0.05 |
| `housing.big.stock_down` | 用股票付首付 | 4.1% | 0.04 |
| `bigtech.crisis.go_home` | 回老家 | 4.0% | 0.04 |
| `unemployed.policy.follow_up` | 一对一帮扶 | 4.0% | 0.05 |
| `family.care.allowance` | 父母的工资 | 4.0% | 0.09 |
| `unemployed.gap.fake_work` | 假装上班 | 3.9% | 0.05 |
| `bigtech.cross.dorm_group` | 宿舍群 | 3.9% | 0.04 |
| `service.growth.reapply` | 重新求职 | 3.8% | 0.04 |
| `family.care.two_views` | 两种眼光 | 3.7% | 0.05 |
| `crime.cross.colleague_taken` | 同事被带走 | 3.6% | 0.04 |
| `bigtech.cross.referral` | 前同事内推 | 3.6% | 0.04 |
| `bigtech.growth.internal_transfer` | 内部转岗 | 3.5% | 0.05 |
| `whitecollar.cross.downshift` | 降级求稳 | 3.5% | 0.03 |
| `unemployed.down.move_city` | 换城市 | 3.4% | 0.03 |
| `bigtech.cross.severance_gone` | N+1 花完了 | 3.3% | 0.03 |
| `unemployed.cross.gamble_to_survive` | 翻本 | 3.3% | 0.03 |
| `bigtech.cross.alumni_group` | 毕业生联谊群 | 3.1% | 0.03 |
| `unemployed.down.flyers` | 发传单 | 3.1% | 0.03 |
| `unemployed.late.ride_hailing` | 跑网约车 | 3.1% | 0.03 |
| `service.exit.hometown` | 回老家 | 3.0% | 0.03 |
| `service.store.closed` | 门店关了 | 2.9% | 0.03 |
| `crime.lure.roommate_warns` | 室友提醒 | 2.9% | 0.03 |
| `service.courier.peak` | 快递旺季 | 2.8% | 0.09 |
| `unemployed.cross.classmate_project` | 老同学的项目 | 2.8% | 0.03 |
| `bigtech.crisis.mortgage_layoff` | 房贷 + 裁员 | 2.7% | 0.03 |
| `service.cross.interviewer` | 面试官的反应 | 2.6% | 0.03 |
| `service.owner.daily` | 小店的一年 | 2.6% | 0.08 |
| `bigtech.cross.explain_gap` | 空窗期怎么说 | 2.5% | 0.03 |
| `bigtech.entry.algo_test` | 算法题 | 2.5% | 0.03 |
| `crime.case.summoned` | 被传唤 | 2.4% | 0.03 |
| `crime.case.tell_family` | 告诉家里 | 2.4% | 0.03 |
| `crime.case.fired` | 被开除 | 2.1% | 0.02 |
| `bigtech.cross.fired_no_pay` | 违纪没有赔偿 | 2.0% | 0.02 |
| `bigtech.cross.insurance_gap` | 社保断缴 | 1.9% | 0.02 |
| `bigtech.cross.severance` | 赔偿到账 | 1.9% | 0.02 |
| `crime.case.bail` | 取保 | 1.8% | 0.02 |
| `crime.case.verdict` | 判决 | 1.8% | 0.02 |
| `crime.release.restart` | 重新开始 | 1.8% | 0.02 |
| `bigtech.cross.parents_unaware` | 父母还不知道 | 1.8% | 0.02 |
| `crime.lure.dui_stop` | 只喝了一点 | 1.7% | 0.02 |
| `family.care.after` | 父母走了以后 | 1.7% | 0.02 |
| `bigtech.cross.stack_changed` | 技术栈变了 | 1.7% | 0.02 |
| `bigtech.crisis.age_resume` | 35 岁简历 | 1.6% | 0.02 |
| `crime.case.restitution` | 退赃 | 1.5% | 0.02 |
| `unemployed.cross.daily_cash_job` | 日结兼职 | 1.5% | 0.02 |
| `bigtech.crisis.outsource_convert` | 外包转正 | 1.4% | 0.01 |
| `crime.lure.pyramid` | 外地考察 | 1.3% | 0.01 |
| `crime.cross.returned_envelope` | 当年退回的信封 | 1.3% | 0.01 |
| `crime.case.parents_react` | 父母的反应 | 1.3% | 0.01 |
| `crime.cross.roommate_arrested` | 室友出事 | 1.3% | 0.01 |
| `crime.cross.lookup_user` | 帮忙查个人 | 1.1% | 0.01 |
| `service.courier.back` | 腰伤 | 1.1% | 0.01 |
| `housing.own.default_edge` | 断供边缘 | 1.1% | 0.01 |
| `crime.release.civil_closed` | 考公无缘 | 1.0% | 0.01 |
| `unemployed.cross.loan_shark` | 网贷催收 | 1.0% | 0.01 |
| `unemployed.late.hide_from_spouse` | 瞒着家里 | 1.0% | 0.01 |
| `service.owner.close` | 小店关门 | 1.0% | 0.01 |
| `unemployed.cross.after_dismissal` | 被开除之后 | 0.9% | 0.01 |
| `crime.case.probation` | 缓刑 | 0.9% | 0.01 |
| `service.driver.night` | 夜班司机 | 0.9% | 0.02 |
| `crime.prison.first_month` | 第一个月 | 0.9% | 0.01 |
| `crime.prison.visit` | 探视 | 0.9% | 0.01 |
| `crime.release.no_record_cert` | 无犯罪记录证明 | 0.9% | 0.01 |
| `crime.overseas.high_pay` | 高薪 offer | 0.9% | 0.01 |
| `service.owner.hard_times` | 生意难做 | 0.9% | 0.01 |
| `unemployed.cross.no_ride_hailing` | 网约车也不行 | 0.9% | 0.01 |
| `service.owner.good_year` | 上了榜 | 0.9% | 0.01 |
| `bigtech.cross.noncompete` | 竞业限制 | 0.8% | 0.01 |
| `bigtech.cross.passenger_talk` | 乘客聊裁员 | 0.8% | 0.01 |
| `crime.cross.vendor_dinner` | 供应商的饭局 | 0.8% | 0.01 |
| `crime.cross.roommate_named` | 室友被通报 | 0.8% | 0.01 |
| `service.driver.passenger` | 乘客的故事 | 0.8% | 0.01 |
| `crime.release.out` | 出狱 | 0.7% | 0.01 |
| `unemployed.policy.internship` | 就业见习 | 0.7% | 0.01 |
| `housing.big.sell` | 卖房 | 0.7% | 0.01 |
| `crime.cross.offer_withdrawn` | 背调撤回 offer | 0.7% | 0.01 |
| `unemployed.gap.backpacking` | 穷游 | 0.7% | 0.01 |
| `service.platform.injury_claim` | 职业伤害保障 | 0.6% | 0.01 |
| `crime.lure.card_lent` | 兼职广告 | 0.6% | 0.01 |
| `unemployed.cross.roommate_stop` | 室友劝住 | 0.6% | 0.01 |
| `unemployed.cross.that_year` | 那一年 | 0.6% | 0.01 |
| `crime.prison.partner` | 伴侣 | 0.6% | 0.01 |
| `crime.prison.skill` | 学手艺 | 0.6% | 0.01 |
| `bigtech.cross.back_as_contractor` | 以外包身份回来 | 0.6% | 0.01 |
| `crime.case.admin_penalty_pyramid` | 被传唤 | 0.6% | 0.01 |
| `crime.lure.phone_rings` | 手机一响 | 0.6% | 0.01 |
| `crime.lure.card_frozen` | 卡被冻了 | 0.6% | 0.01 |
| `bigtech.cross.boomerang` | 老东家回流 | 0.5% | 0.01 |
| `crime.cross.lend_to_released` | 帮不帮 | 0.5% | 0.01 |
| `crime.case.surrender` | 主动投案 | 0.5% | 0.00 |
| `crime.release.dorm_group` | 宿舍群 | 0.5% | 0.00 |
| `service.driver.lost_item` | 失物 | 0.5% | 0.00 |
| `crime.release.sealed` | 治安处罚被封存 | 0.5% | 0.00 |
| `unemployed.cross.disclose_record` | 如实报告 | 0.5% | 0.01 |
| `unemployed.cross.resettlement` | 安置帮教 | 0.4% | 0.00 |
| `love.public.insist` | 一定要体制内 | 0.4% | 0.00 |
| `unemployed.cross.frozen_while_jobless` | 失业中被冻卡 | 0.4% | 0.00 |
| `unemployed.seek.overseas_offer` | 境外高薪 | 0.4% | 0.00 |
| `bigtech.cross.late_entry` | 落榜一年后 | 0.4% | 0.00 |
| `love.public.bonus` | 相亲加分 | 0.4% | 0.00 |
| `crime.cross.shady_gig` | 涉罪的私活 | 0.3% | 0.00 |
| `crime.cross.check_passed` | 背调过了 | 0.3% | 0.00 |
| `love.public.wed_year` | 上岸那年 | 0.3% | 0.00 |
| `crime.cross.audit_talk` | 内审约谈 | 0.3% | 0.00 |
| `crime.cross.on_the_list` | 通报名单 | 0.3% | 0.00 |
| `crime.cross.no_severance` | 没有赔偿 | 0.3% | 0.00 |
| `crime.prison.letter` | 室友的信 | 0.3% | 0.00 |
| `unemployed.cross.stay_home_after` | 父母说先在家待着 | 0.2% | 0.00 |
| `crime.release.disclose` | 如实报告 | 0.2% | 0.00 |
| `crime.overseas.passport` | 证件被收 | 0.2% | 0.00 |
| `crime.overseas.missing` | 失联 | 0.2% | 0.00 |
| `crime.overseas.rescued` | 被解救 | 0.2% | 0.00 |
| `crime.cross.age35` | 35 岁 | 0.2% | 0.00 |
| `crime.overseas.silence` | 不敢讲 | 0.2% | 0.00 |
| `crime.cross.small_company` | 小公司收留 | 0.2% | 0.00 |
| `crime.case.admin_penalty_gambling` | 被传唤 | 0.2% | 0.00 |
| `unemployed.cross.out_of_town_offer` | 外地的 offer | 0.2% | 0.00 |
| `crime.overseas.investigated` | 回国调查 | 0.2% | 0.00 |
| `unemployed.cross.bail_interview` | 取保期间面试 | 0.2% | 0.00 |
| `unemployed.cross.record_sealed` | 记录封存了 | 0.1% | 0.00 |
| `unemployed.cross.after_scam_compound` | 被骗出境回来后 | 0.1% | 0.00 |
| `unemployed.cross.old_friend_returns` | 旧朋友又来了 | 0.1% | 0.00 |
| `bigtech.cross.fake_commute` | 背着电脑包出门 | 0.1% | 0.00 |
| `crime.release.relapse` | 复吸 / 复赌 | 0.1% | 0.00 |
| `crime.release.second_chance` | 愿意给机会的老板 | 0.1% | 0.00 |
| `crime.cross.bonus_bet` | 年终奖那晚 | 0.1% | 0.00 |
| `bigtech.crisis.options_void` | 期权 | 0.0% | 0.00 |
| `bigtech.entry.offer_revoked` | 意向书被毁 | 0.0% | 0.00 |
