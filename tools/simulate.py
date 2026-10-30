# -*- coding: utf-8 -*-
"""Minimal life simulator: runs the event library in events/ under the contract in events/README.md.

Usage: python -X utf8 tools/simulate.py [--lives 10000] [--seed 1] [--report reports/sim_report.md]

Paths that have no events yet (public, exam, ...) are simplified stand-ins:
they only provide income and a small yearly chance of moving back to unemployed. Numbers are design
values for testing the event library, not calibrated game balance.
"""
import argparse
import collections
import glob
import json
import os
import random
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import formula  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGES = range(22, 35)  # 13 years from July 2014; the life ends on the 35th birthday, July 2027
BIRTHDAY = 35
CLOSENESS_DECAY = 3
RELATIONSHIP_MOOD = 1  # yearly mood while dating or married
# Roommates' first destinations (always three different ones), with design weights.
ROOMMATE_STARTS = [('bigtech', 0.2), ('whitecollar', 0.35), ('exam', 0.2), ('unemployed', 0.25)]
DAILY_PER_YEAR = 5
CMP = re.compile(r'^(<=|>=|==|<|>)(-?\d+(?:\.\d+)?)$')

# Pay and cost of living: data/income.json (same rules as app/src/engine/income.ts).
TABLE = json.load(open(os.path.join(ROOT, 'data', 'income.json'), encoding='utf-8'))


def data_year(age):
    return str(min(2027, 2014 + age - 22))


def annual_pay(life):
    key = 'bigtech_outsource' if life.path == 'bigtech' and life.sub == 'outsource' else life.path
    rule = TABLE['paths'].get(key)
    if not rule:
        return 0.0
    base = TABLE['series'][rule['series']]['values'].get(data_year(life.age)) or 0
    f = TABLE['factors']
    if rule['by'] == 'level':
        step = f['bigtech_levels']['values'][max(1, min(6, life.level)) - 1]
    else:
        e = f['experience']
        step = min(e['cap'], e['start'] + e['per_year'] * (life.age - 22))
    job = rule.get('sub', {}).get(life.sub or '', 1)
    return (base * step * job * f['degree']['values'][str(life.degree)] * f['city']['values'][str(life.city_tier)]
            * life.personal * getattr(life, 'income_scale', 1.0))


def monthly_spending(life):
    """Living cost (cut back to a floor when pay is short) and the mortgage, plus a share of the rest."""
    pay, living = life.income / 12, life.living_cost
    core = living if pay >= living else max(TABLE['living']['frugal'] * living, pay)
    fixed = core + life.mortgage
    return fixed + TABLE['living']['spend_share'] * max(0, pay - fixed)


def monthly_living(life):
    """Shared rented housing in your city this year; Life scales it by how you live."""
    c = TABLE['series']['urban_consumption']['values']
    index = (c.get(data_year(life.age)) or 0) / c['2014']
    return TABLE['living']['base_2014'][str(life.city_tier)] * index


# Companies and roles on the white-collar path: data/whitecollar.json (same as app/src/engine/whitecollar.ts).
WC = json.load(open(os.path.join(ROOT, 'data', 'whitecollar.json'), encoding='utf-8'))
COMPANY_FLAGS = ('wc_private', 'wc_foreign', 'wc_soe')

# Jobs and workplaces on the service path: data/service.json (same as app/src/engine/service.ts).
SV = json.load(open(os.path.join(ROOT, 'data', 'service.json'), encoding='utf-8'))


# Housing, marriage, children and parents: data/household.json (same rules as app/src/engine/household.ts).
HOUSE = json.load(open(os.path.join(ROOT, 'data', 'household.json'), encoding='utf-8'))


def game_year(age):
    return min(2027, 2014 + age - 22)


def series(name, year):
    return HOUSE['series'][name]['values'].get(str(year), 0)


def home_price(tier, year):
    h = HOUSE['home']
    return series('home_price', year) * h['city_price']['values'][str(tier)] * h['size']['values'][str(tier)]


def down_ratio(tier, year):
    d = HOUSE['home']['down_payment']
    return d['tier1' if tier == 1 else 'other'][str(year)]


def annuity(balance, rate, months):
    if balance <= 0 or months <= 0:
        return 0.0
    r = rate / 100 / 12
    return balance / months if r == 0 else balance * r / (1 - (1 + r) ** -months)


def loan_rate(home, year):
    r = home['base_rate'] + series('lpr_5y', year) - series('lpr_5y', home['year'])
    cap = HOUSE['series']['stock_rate_cap']['values'].get(str(year))
    return min(r, cap) if cap is not None else r
# Modifier keys the engine applies; anything else is reported as unimplemented.
WRITTEN_PATHS = {'bigtech', 'unemployed', 'crime', 'whitecollar', 'service'}
IMPLEMENTED_MODIFIERS = {'job_success', 'layoff', 'promo', 'bigtech_interview', 'ban_same_type', 'shop_risk'}
RISKY = re.compile(r'违法|无法核实|风险很大|陷进去|背调可能')


def cmp(value, expr):
    m = CMP.match(str(expr))
    op, n = m.group(1), float(m.group(2))
    return {'<': value < n, '<=': value <= n, '>': value > n, '>=': value >= n, '==': value == n}[op]


class Life:
    def __init__(self, rng):
        self.rng = rng
        self.age = 22
        self.school_tier = rng.choice([1, 2, 2, 2, 3, 4])
        self.degree = 1 if self.school_tier == 1 else rng.choice([2, 2, 2, 3])
        self.family_tier = rng.randint(1, 5)
        self.city_tier = rng.choice([1, 1, 2, 2, 3, 4, 5])
        self.stats = {k: rng.randint(35, 75) for k in ('health', 'mood', 'ability', 'social')}
        self.money = rng.choice([5000, 10000, 20000]) * self.family_tier
        self.flags, self.modules = set(), set()
        self.path, self.sub, self.role, self.level = 'unemployed', None, None, 1
        self.exit_reason, self.record = None, 'none'
        self.relationship = 'dating' if rng.random() < 0.3 else 'single'
        self.living = 'with_parents' if rng.random() < 0.35 else 'shared'  # or rent (整租), own
        self.scenario = set()  # filled each year from data/timeline.json
        self.roommates = [{'path': 'unemployed', 'close': rng.randint(20, 90), 'released': False} for _ in range(3)]
        p = TABLE['factors']['personal']
        self.personal = p['min'] + (p['max'] - p['min']) * rng.random()
        pa = HOUSE['parents']
        self.parent_age = rng.randint(*pa['age'])
        self.parent_health = rng.randint(*pa['health'])
        if rng.random() < pa['only_child']:
            self.flags.add('only_child')
        self.kids = 0
        self.home = None
        self.npc = False
        self.mates = []  # roommates' lives, run one year behind
        self.months = collections.Counter()
        self.history = set()
        self.gap_months = 0
        self.tenure = 0.0
        self.modifiers = []
        self.fired = collections.Counter()
        self.last_fired = {}
        self.queue = []          # (due month counted from July 2014, event_id)
        self.pending_changes = []  # (from, to)
        self.promo_wait = 0

    # ---- derived values -------------------------------------------------
    @property
    def income(self):
        return annual_pay(self)

    @property
    def living_cost(self):
        h = HOUSE['living']
        couple = self.living != 'with_parents' and (self.relationship == 'married' or 'cohabiting' in self.flags)
        base = monthly_living(self) * h['housing'].get(self.living, 1) * (h['couple'] if couple else 1)
        return base + self.kids * self.child_cost / 12

    @property
    def child_cost(self):
        c = TABLE['series']['urban_consumption']['values']
        index = (c.get(str(game_year(self.age))) or 0) / c['2023']
        return HOUSE['child']['annual_2023'][str(self.city_tier)] * index * HOUSE['child']['your_share']

    @property
    def mortgage(self):
        return self.home['payment'] if self.home and self.home['balance'] > 0 else 0

    @property
    def share(self):
        return 0.5 if self.relationship == 'married' else 1

    def purchase(self, hometown=False):
        tier = HOUSE['home']['hometown_tier'] if hometown else self.city_tier
        y = game_year(self.age)
        mine = home_price(tier, y) * self.share
        down = mine * down_ratio(tier, y)
        cash = down + mine * HOUSE['home']['fees']
        support = down * HOUSE['home']['parent_support']['values'].get(str(self.family_tier), 0)
        return {'tier': tier, 'mine': mine, 'down': down, 'cash': cash, 'support': support}

    @property
    def home_value(self):
        if not self.home:
            return 0
        h = self.home
        return h['price'] * h['share'] * series('home_price', game_year(self.age)) / series('home_price', h['year'])

    def buy_home(self, hometown):
        if self.home:
            return
        p, y = self.purchase(hometown), game_year(self.age)
        self.money += p['support'] - p['cash']
        if p['support'] > 0:
            self.flags.add('parents_helped')
        rate = series('new_loan_rate', y)
        balance, months = p['mine'] - p['down'], HOUSE['home']['loan_months']
        self.home = {'price': p['mine'] / self.share, 'share': self.share, 'year': y, 'tier': p['tier'],
                     'hometown': hometown, 'base_rate': rate, 'rate': rate, 'balance': balance,
                     'months': months, 'payment': annuity(balance, rate, months)}
        self.flags.add('owns_home')
        if hometown:
            self.flags.add('hometown_home')
        self.modules.add('mortgage')

    def sell_home(self):
        if not self.home:
            return
        self.money += self.home_value - self.home['balance']
        self.home = None
        self.flags.discard('owns_home')
        self.flags.discard('hometown_home')
        self.modules.discard('mortgage')
        if self.living == 'own':
            self.living = 'rent'

    def prepay(self, share):
        h = self.home
        if not h or h['balance'] <= 0 or self.money <= 0:
            return
        amount = min(h['balance'], self.money * share)
        self.money -= amount
        h['balance'] -= amount
        h['payment'] = annuity(h['balance'], h['rate'], h['months'])
        if h['balance'] <= 1:
            self.pay_off()

    def reprice_loan(self):
        h = self.home
        if not h or h['balance'] <= 0:
            return
        h['rate'] = loan_rate(h, game_year(self.age))
        h['payment'] = annuity(h['balance'], h['rate'], h['months'])

    def amortize(self):
        h = self.home
        if not h or h['balance'] <= 0:
            return
        h['balance'] -= h['payment'] - h['balance'] * h['rate'] / 100 / 12
        h['months'] -= 1
        if h['balance'] <= 1 or h['months'] <= 0:
            self.pay_off()

    def pay_off(self):
        self.home['balance'] = 0
        self.home['payment'] = 0
        self.modules.discard('mortgage')

    def modifier(self, key):
        v = 1.0
        for m in self.modifiers:
            if key in m:
                v *= m[key]
        return v

    def stat(self, key):
        if key == 'savings_months':
            return self.money / self.living_cost
        if key == 'debt_months':
            return max(0, -self.money) / self.living_cost
        if key in ('home_afford', 'hometown_afford'):
            p = self.purchase(key == 'hometown_afford')
            return (self.money + p['support']) / p['cash']
        if key == 'mortgage_burden':
            return self.mortgage / max(1, self.income / 12)
        return self.stats[key]

    def evaluate(self, expr):
        values = {'age': self.age, 'level': self.level, 'tenure': self.tenure, 'gap_months': self.gap_months,
                  'income': self.income, 'monthly': self.income / 12, 'living': self.living_cost,
                  'city_tier': self.city_tier, 'savings': self.money, 'kids': self.kids, 'parent_age': self.parent_age,
                  'parent_health': self.parent_health, 'mortgage': self.mortgage, 'home_value': self.home_value,
                  'down_payment': self.purchase()['cash']}
        values.update(self.stats)
        return formula.evaluate(expr, values, self.flags, self.modules, self.modifier)

    # ---- path switching -------------------------------------------------
    def switch_path(self, new, sub=None):
        old = self.path
        if new == old and sub is None:
            return
        self.path = new
        self.sub = sub
        self.history.add(new)
        if new == 'unemployed':
            self.gap_months = 0
            if self.tenure < 1:
                self.flags.add('ui_under_one_year')
        else:
            self.tenure = 0.0
            self.flags.discard('ui_under_one_year')
            self.flags.add('on_probation')
            self.income_scale = 1.0
        if new == 'bigtech':
            self.sub = sub or ('outsource' if self.rng.random() < 0.3 else 'fulltime')
            self.role = self.rng.choice(['dev', 'dev', 'dev', 'product', 'ops', 'data', 'buyer'])
            self.flags = {f for f in self.flags if not f.startswith('entity_')}
            self.flags.add(self.rng.choice(['entity_cat_factory', 'entity_goose_factory', 'entity_other']))
            self.roommate_flag_bigtech = True
        if new == 'whitecollar':
            self.join_company()
            tr = WC['trainee']
            if self.age == 22 and self.school_tier >= tr['school_tier'] and self.rng.random() < tr['share']:
                self.sub = 'trainee'
        if new == 'service':
            self.join_job(sub)
        if old != new:
            self.pending_changes.append((old, new))

    def join_job(self, job=None):
        """Starts a service job (given, or drawn) at a new workplace, at the bottom. Platform work has no probation."""
        jobs = SV['jobs']
        if job not in jobs:
            can_drive = 'has_car' in self.flags and self.record == 'none'
            keys = list(jobs)
            job = self.rng.choices(keys, [0 if jobs[k].get('needs_car') and not can_drive else jobs[k]['weight']
                                          for k in keys])[0]
        n = SV['names']
        if job == 'rider':
            self.company = self.rng.choice(n['area']) + '站'
        elif job == 'courier':
            self.company = self.rng.choice(n['courier']) + '快递'
        elif job in ('store', 'owner'):
            self.company = self.rng.choice(n['shop_prefix']) + self.rng.choice(n['shop_suffix'])
        else:
            self.company = ''
        self.sub = job
        self.level = 1
        if jobs[job]['platform']:
            self.flags.discard('on_probation')

    def join_company(self, kind=None):
        """Starts at a new white-collar company: type flag, role and name (a job hop keeps the path)."""
        types = list(WC['types'])
        if kind not in WC['types']:
            kind = self.rng.choices(types, [WC['types'][k]['weight'] for k in types])[0]
        roles = list(WC['roles'])
        self.role = self.rng.choices(roles, [WC['roles'][r] for r in roles])[0]
        self.company = self.rng.choice(WC['names']['prefix']) + self.rng.choice(WC['names']['suffix'][kind])
        self.flags.difference_update(COMPANY_FLAGS)
        self.flags.add('wc_' + kind)


class Simulator:
    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.schedule, self.month = [], 0
        self.events = {}
        for f in sorted(glob.glob(os.path.join(ROOT, 'events', '**', '*.json'), recursive=True)):
            for ev in json.load(open(f, encoding='utf-8')):
                self.events[ev['id']] = ev
        timeline = json.load(open(os.path.join(ROOT, 'data', 'timeline.json'), encoding='utf-8'))
        self.timeline = timeline['scenario']
        self.seasons = {k: v['months'] for k, v in timeline['seasons'].items() if not k.startswith('_')}
        self.by_trigger = collections.defaultdict(list)
        for ev in self.events.values():
            kind = ev.get('trigger') or ('chance' if 'chance' in ev else 'weight')
            self.by_trigger[kind].append(ev)
        self.stats = {
            'fired_lives': collections.Counter(), 'fired_total': collections.Counter(),
            'drop_blocked': collections.Counter(), 'drop_expired': collections.Counter(),
            'drop_missing': collections.Counter(), 'expr_errors': collections.Counter(),
            'unused_modifiers': collections.Counter(), 'final_path': collections.Counter(),
            'paths_per_life': collections.Counter(), 'ever_path': collections.Counter(),
            'events_per_year': [], 'choices_per_year': [], 'written_events': [], 'written_choices': [], 'event_sets': [], 'final_money': [],
            'final_mood': [], 'record': collections.Counter(), 'laid_off': 0, 'stuck_prison': 0,
            'bigtech_laid_off': 0,
        }

    # ---- conditions ------------------------------------------------------
    def check(self, life, w):
        if not w:
            return True
        for k, v in w.items():
            if k in ('path', 'not_path'):
                hit = life.path in (v if isinstance(v, list) else [v])
                if hit != (k == 'path'):
                    return False
            elif k == 'sub':
                if life.sub not in (v if isinstance(v, list) else [v]):
                    return False
            elif k == 'tenure':
                if not cmp(life.tenure, v):
                    return False
            elif k == 'role':
                if life.role not in (v if isinstance(v, list) else [v]):
                    return False
            elif k == 'level':
                if not cmp(life.level, v):
                    return False
            elif k == 'stat':
                if not all(cmp(life.stat(s), c) for s, c in v.items()):
                    return False
            elif k == 'flags':
                if not all(f in life.flags for f in v):
                    return False
            elif k == 'not_flags':
                if any(f in life.flags for f in v):
                    return False
            elif k == 'module':
                if v not in life.modules:
                    return False
            elif k == 'not_module':
                if v in life.modules:
                    return False
            elif k == 'history_any':
                if not any(p in life.history for p in v):
                    return False
            elif k == 'history_months':
                if not all(cmp(life.months[p], c) for p, c in v.items()):
                    return False
            elif k == 'gap_months':
                if not cmp(life.gap_months, v):
                    return False
            elif k == 'exit_reason':
                if life.exit_reason != v:
                    return False
            elif k == 'record':
                if life.record != v:
                    return False
            elif k in ('degree', 'school_tier', 'family_tier', 'city_tier'):
                if not cmp(getattr(life, k), v):
                    return False
            elif k == 'year':
                if not cmp(2014 + life.age - 22 + (1 if self.month >= 6 else 0), v):
                    return False
            elif k == 'scenario':
                if v not in life.scenario:
                    return False
            elif k == 'roommate':
                ok = False
                for r in life.roommates:
                    if ('close' not in v or cmp(r['close'], v['close'])) and ('path' not in v or r['path'] == v['path']):
                        ok = True
                if not ok:
                    return False
            elif k == 'living':
                if life.living not in (v if isinstance(v, list) else [v]):
                    return False
            elif k == 'kids':
                if not cmp(life.kids, v):
                    return False
            elif k == 'parent_age':
                if not cmp(life.parent_age, v):
                    return False
            elif k == 'relationship':
                if life.relationship not in (v if isinstance(v, list) else [v]):
                    return False
            elif k == 'season':
                if (self.month + 6) % 12 + 1 not in self.season_months(v):
                    return False
            elif k == 'age':
                if not cmp(life.age, v):
                    return False
        return True

    def eligible(self, life, ev):
        lo, hi = ev['age']
        if not lo <= life.age <= hi:
            return False
        n = life.fired[ev['id']]
        if ev.get('once') and n:
            return False
        if 'cooldown' in ev and ev['id'] in life.last_fired and life.age - life.last_fired[ev['id']] < ev['cooldown']:
            return False
        return self.check(life, ev.get('when'))

    # ---- effects ---------------------------------------------------------
    def apply(self, life, eff, ev_id):
        if not eff:
            return
        for k in ('health', 'mood', 'ability', 'social'):
            if k in eff:
                life.stats[k] = max(0, min(100, life.stats[k] + eff[k]))
        if 'money' in eff:
            try:
                life.money += life.evaluate(eff['money'])
            except Exception:
                self.stats['expr_errors'][ev_id] += 1
        life.flags.update(eff.get('flags_add', []))
        life.flags.difference_update(eff.get('flags_remove', []))
        if 'module_start' in eff:
            life.modules.add(eff['module_start'])
        if 'module_end' in eff:
            m = eff['module_end']
            if m in life.modules and m in ('gambling', 'drugs'):
                life.flags.add('module_quit')
            life.modules.discard(m)
        if 'exit_reason' in eff:
            life.exit_reason = eff['exit_reason']
            if eff['exit_reason'] == 'laid_off':
                life.was_laid_off = True
        if 'record' in eff:
            if not (life.record == 'criminal' and eff['record'] == 'sealed'):
                life.record = eff['record']
        if 'path' in eff:
            life.switch_path(eff['path'], eff.get('sub'))
        elif 'sub' in eff and life.path == 'service':
            life.join_job(eff['sub'])
        elif 'sub' in eff:
            life.sub = eff['sub']
        if 'level' in eff:
            life.level = max(1, min(6, life.level + eff['level']))
        if 'income_mult' in eff:
            life.income_scale = getattr(life, 'income_scale', 1.0) * eff['income_mult']
        if 'roommate_close' in eff:
            r = self.rng.choice(life.roommates)
            r['close'] = max(0, min(100, r['close'] + eff['roommate_close']))
        if 'modifier' in eff:
            mod = dict(eff['modifier'])
            for key in mod:
                if key != 'months' and key not in IMPLEMENTED_MODIFIERS:
                    self.stats['unused_modifiers'][key] += 1
            life.modifiers.append(mod)
        if 'relationship' in eff:
            life.relationship = eff['relationship']
            if eff['relationship'] != 'dating':
                life.flags.discard('cohabiting')
            if eff['relationship'] == 'married' and life.living in ('with_parents', 'shared'):
                life.living = 'rent'  # a couple moves into a flat of their own
        if 'living' in eff:
            life.living = eff['living']
        if 'kids' in eff:
            life.kids = max(0, life.kids + eff['kids'])
        if 'buy_home' in eff:
            life.buy_home(eff['buy_home'] == 'hometown')
        if eff.get('sell_home'):
            life.sell_home()
        if 'prepay' in eff:
            life.prepay(eff['prepay'])
        if eff.get('company') and life.path == 'whitecollar':
            life.join_company(None if eff['company'] == 'new' else eff['company'])
            life.tenure = 0.0
            life.flags.add('on_probation')
        if 'parent_health' in eff:
            life.parent_health = max(0, min(100, life.parent_health + eff['parent_health']))

    def queue(self, life, followups):
        for fu in followups or []:
            if self.rng.random() < fu.get('chance', 1):
                wait = fu.get('delay', 0) * 12 + fu.get('delay_months', 0)
                if wait == 0:  # same month, ahead of the remaining slots
                    self.schedule.insert(0, (self.month, 'follow', fu['id']))
                elif self.month + wait < 12:  # later this year, after that month's planned slots
                    month = self.month + wait
                    i = next((k for k, s in enumerate(self.schedule) if s[0] > month), len(self.schedule))
                    self.schedule.insert(i, (month, 'follow', fu['id']))
                else:
                    life.queue.append(((life.age - 22) * 12 + self.month + wait, fu['id']))

    # ---- firing ----------------------------------------------------------
    def fire(self, life, ev, counters):
        eid = ev['id']
        life.fired[eid] += 1
        life.last_fired[eid] = life.age
        counters['events'] += 1
        if eid == 'bigtech.growth.promo_result':  # engine hook: decide promotion before the text is chosen
            if self.rng.random() < 0.5 * life.modifier('promo'):
                life.flags.add('promo_passed')
                life.level = min(6, life.level + 1)
            else:
                life.flags.discard('promo_passed')
        self.apply(life, ev.get('effects'), eid)
        opts = ev.get('options')
        if opts:
            counters['choices'] += 1
            avail = [o for o in opts if self.check(life, o.get('unlock'))] or opts
            weights = [(0.3 if RISKY.search(o.get('hint', '')) else 1.0) * o.get('auto', 1) for o in avail]
            o = self.rng.choices(avail, weights)[0]
            self.apply(life, o.get('effects'), eid)
            if 'p' in o:
                try:
                    p = life.evaluate(o['p'])
                except Exception:
                    self.stats['expr_errors'][eid] += 1
                    p = 0.5
                p = min(1.0, max(0.0, p))
                self.apply(life, o['success'] if self.rng.random() < p else o['fail'], eid)
            self.queue(life, o.get('followups'))
        self.queue(life, ev.get('followups'))
        self.flush_changes(life, counters)

    def flush_changes(self, life, counters):
        while life.pending_changes:
            old, new = life.pending_changes.pop(0)
            for ev in self.by_trigger['path_change']:
                tr = ev['transition']
                if tr.get('from', old) == old and tr.get('to', new) == new and self.eligible(life, ev):
                    self.fire(life, ev, counters)

    def follow_ok(self, life, eid):
        ev = self.events.get(eid)
        if life.npc:
            return ev if ev and ev['age'][0] <= life.age <= ev['age'][1] and self.check(life, ev.get('when')) else None
        if not ev:
            self.stats['drop_missing'][eid] += 1
        elif not ev['age'][0] <= life.age <= ev['age'][1]:
            self.stats['drop_expired'][eid] += 1
        elif not self.check(life, ev.get('when')):
            self.stats['drop_blocked'][eid] += 1
        else:
            return ev
        return None

    # ---- engine-maintained state ------------------------------------------
    def year_start(self, life):
        rng = life.rng
        life.scenario = scenario_states(self.timeline[str(2014 + life.age - 22)])
        f = life.flags
        f.discard('interviewing'); f.discard('job_seeking'); f.discard('multiple_offers')
        if 'low_perf' in f:
            life.low_perf_years = getattr(life, 'low_perf_years', 0) + 1
            if life.low_perf_years > 1:
                f.discard('low_perf')
                life.low_perf_years = 0
        if life.sub == 'trainee' and life.age >= WC['trainee']['until_age']:
            life.sub = None
        if life.age < 24:
            f.add('fresh_grad')
        else:
            f.discard('fresh_grad')
        if life.path == 'unemployed':
            f.add('job_seeking')
            if rng.random() < 0.6:
                f.add('interviewing')
        if life.age == 22 and life.school_tier >= 3:
            f.add('seeking_bigtech')
            if rng.random() < 0.3:
                f.add('multiple_offers')
            if rng.random() < 0.2:
                f.add('signed_intent')
        elif life.age > 22:
            f.discard('seeking_bigtech'); f.discard('signed_intent')
        if life.path == 'bigtech' and life.sub == 'fulltime':
            life.promo_wait += 1
            if life.promo_wait >= 2:
                f.add('promo_eligible')
        if life.age >= 26 and life.income > 150000 and rng.random() < 0.2:
            f.add('has_car')
        if 'moved_home' in f and life.living != 'own':
            life.living = 'with_parents'
        life.reprice_loan()
        if not life.npc:
            self.sync_roommates(life)

    def sync_roommates(self, life):
        """Lives the roommates' previous year, then copies where they stand into the player's state."""
        for r, mate in zip(life.roommates, life.mates):
            before = r['path']
            if life.age > 22:
                while mate.age < life.age:
                    self.run_year(mate)
                r['close'] = max(0, r['close'] - CLOSENESS_DECAY)
            r['path'] = mate.path
            if r['path'] == 'crime' and before != 'crime' and 'bigtech' in mate.history:
                life.flags.add('roommate_was_bigtech')
            if before == 'crime' and r['path'] != 'crime':
                r['released'] = True
                life.flags.add('roommate_released')

    def month_tick(self, life):
        rng = life.rng
        life.money += life.income / 12 - monthly_spending(life)
        life.amortize()
        life.months[life.path] += 1
        if life.path == 'unemployed':
            life.gap_months += 1
            if 'has_offer' not in life.flags:
                p = 0.10 * life.modifier('job_success') * (0.5 + life.stats['ability'] / 100)
                if life.record == 'criminal':
                    p *= 0.3
                if 'bail' in life.modules:
                    p *= 0.5
                if rng.random() < p:
                    life.flags.update(['has_offer', 'background_check'])
        else:
            life.tenure += 1 / 12
        for m in life.modifiers:
            if 'months' in m:
                m['months'] -= 1
        life.modifiers = [m for m in life.modifiers if m.get('months', 1) > 0]

    def yearly_modules(self, life):
        rng = life.rng
        if 'gambling' in life.modules:
            life.money -= max(life.income, 30000) * 0.2
            if rng.random() < 0.06:
                life.modules.discard('gambling'); life.flags.add('module_quit')
        if 'debt' in life.modules:
            life.money -= 3000
            if life.money > 6 * life.living_cost:
                life.modules.discard('debt')
        if 'side_job' in life.modules:
            life.money += 12000
        if 'counseling' in life.modules:
            life.stats['mood'] = min(100, life.stats['mood'] + 5)
        if 'probation' in life.modules and rng.random() < 0.5:
            life.modules.discard('probation')
        life.stats['health'] = max(0, life.stats['health'] - 1)
        if life.relationship != 'single':  # being with someone lifts the year a little
            life.stats['mood'] = min(100, life.stats['mood'] + RELATIONSHIP_MOOD)
        life.parent_age += 1
        if life.parent_age >= HOUSE['parents']['decline_from']:
            life.parent_health = max(0, life.parent_health - rng.randint(1, 3))

    def year_end(self, life, counters):
        # accepted offer becomes a job unless an event removed it
        if life.path == 'unemployed' and 'has_offer' in life.flags:
            life.flags.difference_update(['has_offer', 'background_check'])
            r = life.rng.random()
            p_big = 0.15 * life.modifier('bigtech_interview')
            if life.record == 'criminal' or 'industry_blacklist' in life.flags or life.modifier('ban_same_type') != 1.0:
                p_big = 0
            new = 'bigtech' if r < p_big else ('whitecollar' if r < 0.7 else 'service')
            life.switch_path(new)
            self.flush_changes(life, counters)
        elif life.path != 'unemployed':
            life.flags.discard('on_probation')
        # stand-in paths: small yearly churn back to unemployed
        if life.path == 'public' and life.rng.random() < 0.05:
            life.exit_reason = 'laid_off'
            life.switch_path('unemployed')
            self.flush_changes(life, counters)
        if life.path == 'exam' and life.rng.random() < 0.3:
            life.switch_path('public' if life.rng.random() < 0.3 else 'unemployed')
            self.flush_changes(life, counters)

    # ---- one year's slots (mirrors planYear / resolveSlot in app/src/engine/engine.ts) ----
    def season_months(self, v):
        """Calendar months (1-12) of one or more seasons from data/timeline.json."""
        return [m for s in (v if isinstance(v, list) else [v]) for m in self.seasons.get(s, [])]

    def plan_year(self, life, rng):
        """Due follow-ups in month 0; every chance event and the daily picks in a random month each.
        What a slot fires is decided when its month comes, so events see that month's state."""
        start = (life.age - 22) * 12
        due = [q for q in life.queue if q[0] < start + 12]
        life.queue = [q for q in life.queue if q[0] >= start + 12]
        slots = [(max(0, d - start), 'follow', eid) for d, eid in due]
        for ev in self.by_trigger['chance']:
            # a seasonal event gets its yearly roll in one of its months
            season = ev.get('when', {}).get('season')
            month = rng.choice([(m + 5) % 12 for m in self.season_months(season)]) if season else rng.randint(0, 11)
            slots.append((month, 'chance', ev['id']))
        slots += [(rng.randint(0, 11), 'daily', None) for _ in range(DAILY_PER_YEAR)]
        self.schedule = sorted(slots, key=lambda x: x[0])

    def resolve_slot(self, life, rng, slot, picked):
        _, kind, eid = slot
        if kind == 'daily':
            pool = [ev for ev in self.by_trigger['weight'] if ev['id'] not in picked and self.eligible(life, ev)]
            if not pool:
                return None
            ev = rng.choices(pool, [e['weight'] for e in pool])[0]
            picked.add(ev['id'])
            return ev
        if kind == 'follow':
            return self.follow_ok(life, eid)
        ev = self.events[eid]
        if not self.eligible(life, ev):
            return None
        try:
            p = min(1.0, max(0.0, life.evaluate(ev['chance'])))
        except Exception:
            self.stats['expr_errors'][eid] += 1
            p = 0.0
        return ev if rng.random() < p else None

    # ---- one life ---------------------------------------------------------
    def new_life(self, rng, start=None, npc=False):
        life = Life(rng)
        r = rng.random()
        start = start or ('bigtech' if r < 0.15 else ('unemployed' if r < 0.55 else 'whitecollar'))
        life.switch_path(start)
        life.pending_changes.clear()
        life.flags.discard('on_probation')
        life.history.add(start)
        life.was_laid_off = False
        life.npc = npc
        if not npc:
            starts = list(ROOMMATE_STARTS)
            for r in life.roommates:
                pick = rng.choices(starts, [w for _, w in starts])[0]
                starts.remove(pick)
                mate = self.new_life(random.Random(rng.random()), pick[0], npc=True)
                life.mates.append(mate)
                r['path'] = mate.path
        return life

    def run_year(self, life):
        """One year of a life (ages 22-34), or the 35th birthday; returns the year's counters."""
        counters = collections.Counter()
        rng = life.rng
        if life.age == BIRTHDAY:
            # the echo events written for exactly 35 get their chance, then the life ends
            self.month = 0
            if not life.npc:
                self.sync_roommates(life)
            self.schedule = [(0, 'chance', ev['id']) for ev in self.by_trigger['chance'] if ev['age'][0] == BIRTHDAY]
            while self.schedule:
                ev = self.resolve_slot(life, rng, self.schedule.pop(0), set())
                if ev:
                    self.fire(life, ev, counters)
            life.age += 1
            return counters
        self.year_start(life)
        self.plan_year(life, rng)
        picked = set()
        for self.month in range(12):
            self.month_tick(life)
            while self.schedule and self.schedule[0][0] <= self.month:
                ev = self.resolve_slot(life, rng, self.schedule.pop(0), picked)
                if ev:
                    self.fire(life, ev, counters)
        self.yearly_modules(life)
        self.year_end(life, counters)
        life.age = BIRTHDAY if life.age >= AGES[-1] else life.age + 1
        return counters

    def run_life(self):
        rng = random.Random(self.rng.random())
        life = self.new_life(rng)
        while life.age in AGES:
            on_written_path = life.path in WRITTEN_PATHS
            counters = self.run_year(life)
            self.stats['events_per_year'].append(counters['events'])
            self.stats['choices_per_year'].append(counters['choices'])
            if on_written_path:
                self.stats['written_events'].append(counters['events'])
                self.stats['written_choices'].append(counters['choices'])
        self.run_year(life)  # 35th birthday
        st = self.stats
        for eid, n in life.fired.items():
            st['fired_lives'][eid] += 1
            st['fired_total'][eid] += n
        st['final_path'][life.path + ('/' + life.sub if life.sub == 'prison' else '')] += 1
        st['paths_per_life'][len(life.history)] += 1
        for p in life.history:
            st['ever_path'][p] += 1
        st['event_sets'].append(frozenset(life.fired))
        st['final_money'].append(life.money)
        st['final_mood'].append(life.stats['mood'])
        st['record'][life.record] += 1
        st['laid_off'] += life.was_laid_off
        st['bigtech_laid_off'] += life.fired['bigtech.crisis.laid_off'] > 0
        st['stuck_prison'] += life.sub == 'prison'
        self.unexpired_queue = getattr(self, 'unexpired_queue', 0) + len(life.queue)


def scenario_states(year):
    """Era states active in a year of data/timeline.json; events test membership."""
    states = set()
    if year['internet'] == 1:
        states.add('expansion')
    if year['internet'] == -1:
        states.add('contraction')
    if year['ai']:
        states.add('ai_wave')
    if year['property'] == 1:
        states.add('property_boom')
    if year['property'] == -1:
        states.add('property_slump')
    return states


def metrics(sim, lives):
    """Key numbers shared with the TypeScript engine's simulator (tools/parity.py compares them)."""
    st = sim.stats
    pairs = list(zip(st['event_sets'][::2], st['event_sets'][1::2]))
    return {
        'lives': lives,
        'events_per_year_written': sum(st['written_events']) / max(1, len(st['written_events'])),
        'choices_per_year_written': sum(st['written_choices']) / max(1, len(st['written_choices'])),
        'jaccard': sum(len(a & b) / max(1, len(a | b)) for a, b in pairs) / max(1, len(pairs)),
        'three_plus_paths': sum(v for k, v in st['paths_per_life'].items() if k >= 3) / lives,
        'criminal': st['record']['criminal'] / lives,
        'bigtech_laid_off': st['bigtech_laid_off'] / max(1, st['ever_path']['bigtech']),
        'ever_path': {p: n / lives for p, n in st['ever_path'].items()},
        'fired_lives': {e: st['fired_lives'][e] / lives for e in sim.events},
    }


def pct(n, total):
    return '%.1f%%' % (100.0 * n / total) if total else '-'


def report(sim, lives, seconds):
    st, ev = sim.stats, sim.events
    out = []
    w = out.append
    w('# 模拟报告\n')
    w('由 `tools/simulate.py` 生成：%d 局，用时 %.1f 秒。引擎是最小实现，只用来检查事件库能不能跑通；'
      '没有事件的路径和领域用简化的替身，数值都是【设计】值，不代表游戏平衡。\n' % (lives, seconds))
    epy, cpy = st['events_per_year'], st['choices_per_year']
    w('## 总览\n')
    w('| 指标 | 结果 | 设计目标 |')
    w('| --- | --- | --- |')
    w('| 每年事件数（平均） | %.1f | 8–12 |' % (sum(epy) / len(epy)))
    w('| 每年抉择数（平均） | %.2f | 1–3 |' % (sum(cpy) / len(cpy)))
    we, wc = st['written_events'], st['written_choices']
    w('| 每年事件数（只算年初在已写路径的年份） | %.1f | 8–12 |' % (sum(we) / max(1, len(we))))
    w('| 每年抉择数（只算年初在已写路径的年份） | %.2f | 1–3 |' % (sum(wc) / max(1, len(wc))))
    w('| 每局不同事件数（平均） | %.1f | — |' % (sum(len(s) for s in st['event_sets']) / lives))
    pairs = list(zip(st['event_sets'][::2], st['event_sets'][1::2]))
    rep = sum(len(a & b) / max(1, len(a | b)) for a, b in pairs) / max(1, len(pairs))
    w('| 两局之间事件重合度（Jaccard） | %.0f%% | 重复率 < 20%% |' % (100 * rep))
    w('| 经历 3 条以上路径的局 | %s | 约 70%%（全部路径写完后） |' % pct(sum(v for k, v in st['paths_per_life'].items() if k >= 3), lives))
    w('| 有刑事记录 | %s | — |' % pct(st['record']['criminal'], lives))
    w('| 被裁过 | %s | — |' % pct(st['laid_off'], lives))
    w('| 进过大厂的人中被大厂裁过 | %s | 30–35%% |' % pct(st['bigtech_laid_off'], st['ever_path']['bigtech']))
    w('| 35 岁时仍在服刑 | %s | — |' % pct(st['stuck_prison'], lives))
    money = sorted(st['final_money'])
    w('| 35 岁存款中位数 | %d 元 | — |' % money[len(money) // 2])
    w('| 35 岁存款为负 | %s | — |' % pct(sum(1 for m in money if m < 0), lives))
    w('| 35 岁心情平均 | %.0f | — |\n' % (sum(st['final_mood']) / lives))

    w('## 路径\n')
    w('| 路径 | 35 岁时在这条路径 | 一生中进入过 |')
    w('| --- | --- | --- |')
    for p in sorted(set(st['ever_path']) | {k.split('/')[0] for k in st['final_path']}):
        final = sum(v for k, v in st['final_path'].items() if k.split('/')[0] == p)
        w('| %s | %s | %s |' % (p, pct(final, lives), pct(st['ever_path'][p], lives)))
    w('')

    never = sorted(e for e in ev if st['fired_lives'][e] == 0)
    rare = sorted((e for e in ev if 0 < st['fired_lives'][e] < lives * 0.002), key=lambda e: st['fired_lives'][e])
    w('## 从未触发的事件（%d 条）\n' % len(never))
    for e in never:
        w('- `%s`（%s）' % (e, ev[e]['seed']))
    w('\n## 极少触发的事件（< 0.2%% 的局，%d 条）\n' % len(rare))
    for e in rare:
        w('- `%s`（%s）：%s' % (e, ev[e]['seed'], pct(st['fired_lives'][e], lives)))
    w('\n## 断掉的连锁\n')
    w('| 目标事件 | 条件不满足 | 超出年龄 | 不存在 |')
    w('| --- | --- | --- | --- |')
    targets = set(st['drop_blocked']) | set(st['drop_expired']) | set(st['drop_missing'])
    for e in sorted(targets, key=lambda e: -(st['drop_blocked'][e] + st['drop_expired'][e])):
        w('| `%s` | %d | %d | %d |' % (e, st['drop_blocked'][e], st['drop_expired'][e], st['drop_missing'][e]))
    if not targets:
        w('| 无 | | | |')
    w('\n35 岁时还排在队列里没执行的后续事件：%d 个。\n' % getattr(sim, 'unexpired_queue', 0))
    w('## 引擎尚未实现的机制\n')
    if st['unused_modifiers']:
        for k, n in st['unused_modifiers'].most_common():
            w('- 修正项 `%s`：出现 %d 次，目前没有效果' % (k, n))
    else:
        w('- 无')
    if st['expr_errors']:
        w('\n表达式错误：' + '，'.join('`%s` %d 次' % kv for kv in st['expr_errors'].items()))
    w('\n## 每条事件的触发率\n')
    w('| 事件 | 种子 | 触发过的局 | 平均每局次数 |')
    w('| --- | --- | --- | --- |')
    for e in sorted(ev, key=lambda e: -st['fired_lives'][e]):
        w('| `%s` | %s | %s | %.2f |' % (e, ev[e]['seed'], pct(st['fired_lives'][e], lives), st['fired_total'][e] / lives))
    return '\n'.join(out) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lives', type=int, default=10000)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--report', default=os.path.join(ROOT, 'reports', 'sim_report.md'))
    ap.add_argument('--json', help='also write key metrics as JSON to this path')
    args = ap.parse_args()
    sim = Simulator(args.seed)
    t = time.time()
    for _ in range(args.lives):
        sim.run_life()
    text = report(sim, args.lives, time.time() - t)
    os.makedirs(os.path.dirname(args.report), exist_ok=True)
    open(args.report, 'w', encoding='utf-8').write(text)
    if args.json:
        json.dump(metrics(sim, args.lives), open(args.json, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(text.split('## 每条事件的触发率')[0])


if __name__ == '__main__':
    main()
