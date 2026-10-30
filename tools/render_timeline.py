# -*- coding: utf-8 -*-
"""Renders research/timeline.md from data/timeline.json (the JSON is the source of truth).

Usage: python -X utf8 tools/render_timeline.py
"""
import collections
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LABELS = {'data': '数据', 'report': '报道', 'design': '设计', 'projection': '推演'}
INTRO = """# 时间线：2014–2027

本作的时代固定为真实的 2014–2027 年：玩家是 2014 届毕业生，2014 年 7 月 22 岁开局，2027 年满 35 岁结束。这份档案收集这 13 年里中国和世界发生的真实事件和逐年统计，用作三件事的素材：

1. **时代参数**：替代原来随机抽取的时代剧本，每年的互联网、房地产、考公热度、AI、疫情状态由真实事件推定（见"时代参数"一节）。
2. **时代新闻条**：游戏里滚动的新闻标题。
3. **按年份取数的数据锚点**：同一个事件在不同年份引用当年的统计。

> 本文件由 `tools/render_timeline.py` 从 `data/timeline.json` 生成，修改请改 JSON 后重新生成。

标注沿用调研档案的约定：【数据】有出处；【报道】公开报道，待补链接或口径未核实；【设计】设计值；【推演】2026 年 11 月以后的内容，只用已公布的日程和趋势，不编造具体事件。
"""


def main():
    tl = json.load(open(os.path.join(ROOT, 'data', 'timeline.json'), encoding='utf-8'))
    out = [INTRO]
    w = out.append

    w('## 逐年统计\n')
    years = [str(y) for y in range(2014, 2028)]
    for key in ('graduates_10k', 'kaoyan_10k'):
        s = tl['series'][key]
        w('**%s**（来源：[%s](%s)）\n' % (s['name'], s['source'], s['url']))
        w('| ' + ' | '.join(['年份'] + years) + ' |')
        w('| ' + ' | '.join(['---'] * (len(years) + 1)) + ' |')
        cells = []
        for y in years:
            v = s['values'].get(y)
            mark = '' if s['label'].get(y, s['label'].get('default')) == 'data' else '*'
            cells.append('—' if v is None else '%s%s' % (v, mark))
        w('| 数值 | ' + ' | '.join(cells) + ' |\n')
    w('带 * 的是通行数字，还没对照教育部原文，标注为【报道】。\n')
    s = tl['series']['avg_wage']
    w('**%s**（来源：%s）\n' % (s['name'], s['source']))
    w('| 年份 | 数值 | 出处 |')
    w('| --- | --- | --- |')
    for y in years:
        v = s['values'].get(y)
        url = next((u for k, u in s['urls'].items() if y in k or (k[:4] <= y <= k[-4:])), '')
        w('| %s | %s | %s |' % (y, '—' if v is None else v, '[链接](%s)' % url if v is not None and url else ''))
    w('\n' + s['note'] + '\n')
    for key in ('civil_exam_ratio', 'youth_unemployment'):
        s = tl['series'][key]
        w('**%s**（来源：[%s](%s)）\n' % (s['name'], s['source'], s['url']))
        w('| 时间 | 数值 |')
        w('| --- | --- |')
        for k, v in s['values'].items():
            w('| %s | %s |' % (k, v))
        if s.get('note'):
            w('\n' + s['note'] + '。')
        w('')

    w('## 时代参数（【设计】）\n')
    w('每年的状态由下面的事件推定，取代原来随机抽取的时代剧本。`internet` / `property`：1 扩张、0 平稳、−1 收缩；`exam_heat`：考公热度系数（2014 年为 1.0）；`ai`、`pandemic`：AI 浪潮、疫情影响。\n')
    w('| 年份 | 互联网 | 房地产 | 考公热度 | AI | 疫情 |')
    w('| --- | --- | --- | --- | --- | --- |')
    for y in years:
        sc = tl['scenario'][y]
        w('| %s%s | %s | %s | %.1f | %s | %s |' % (y, '（推演）' if sc.get('label') == 'projection' else '',
                                                 sc['internet'], sc['property'], sc['exam_heat'], sc['ai'], sc['pandemic']))
    w('')

    w('## 事件\n')
    by_year = collections.OrderedDict()
    for e in tl['events']:
        by_year.setdefault(e['date'][:4], []).append(e)
    for y, evs in by_year.items():
        w('### %s\n' % y)
        w('| 月份 | 类别 | 事件 | 对游戏的影响 | 标注 |')
        w('| --- | --- | --- | --- | --- |')
        for e in evs:
            label = LABELS[e['label']]
            if e.get('url'):
                label = '[%s](%s)' % (label, e['url'])
            elif e.get('source'):
                label += '（来源 `%s`）' % e['source']
            elif e.get('series'):
                label += '（见逐年统计）'
            w('| %s | %s | %s | %s | %s |' % (e['date'][5:], e['cat'], e['title'], e['impact'], label))
        w('')

    counts = collections.Counter(e['label'] for e in tl['events'])
    w('## 待补\n')
    w('- 事件共 %d 条：数据 %d、报道 %d、推演 %d。报道类大多是众所周知的事件，但还没逐条附链接。'
      % (len(tl['events']), counts['data'], counts['report'], counts['projection']))
    w('- 2026 年 1–10 月的事件覆盖偏少：搜索结果来源杂、可信度参差，只收录了已核实或有明确出处的条目，需要按月份专门补。')
    w('- 2014、2015、2017–2019 年的毕业生人数待对照教育部原文；2014–2017 年没有官方青年失业率（2018 年才开始发布），这几年的求职难度用设计值。')
    w('- 国考报录比只核实了 2023–2026 年度，更早的年份待补；考公热度系数目前是按趋势推定的设计值。')
    w('- 国际事件只收了对国内就业、外贸、科技有直接影响的，其余作为新闻条素材可以继续补。')
    text = '\n'.join(out) + '\n'
    open(os.path.join(ROOT, 'research', 'timeline.md'), 'w', encoding='utf-8').write(text)
    print('wrote research/timeline.md: %d events' % len(tl['events']))


if __name__ == '__main__':
    main()
