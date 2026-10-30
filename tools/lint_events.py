# -*- coding: utf-8 -*-
"""Validates events/**/*.json against events/README.md and reports seed coverage per dossier.

Usage: python -X utf8 tools/lint_events.py
Exits with status 1 when any error is found; warnings do not fail the run.
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import formula  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TYPES = {'daily', 'choice', 'chain', 'macro', 'milestone', 'echo'}
WHEN_KEYS = {
    'path', 'not_path', 'sub', 'role', 'level', 'stat', 'flags', 'not_flags', 'module', 'not_module',
    'history_any', 'history_months', 'gap_months', 'exit_reason', 'record', 'degree', 'school_tier',
    'family_tier', 'city_tier', 'year', 'scenario', 'roommate', 'living', 'relationship', 'season',
    'kids', 'parent_age', 'tenure', 'age',
}
# Seasons (calendar months) from data/timeline.json; when.season takes one name or a list.
SEASONS = {k: v['months'] for k, v in json.load(
    open(os.path.join(ROOT, 'data', 'timeline.json'), encoding='utf-8'))['seasons'].items() if not k.startswith('_')}
# Sub-states in use: big tech contracts, trainee, prison, carer, gap year and the service jobs (data/service.json).
SUBS = {'fulltime', 'outsource', 'trainee', 'prison', 'carer', 'gap'} | set(
    json.load(open(os.path.join(ROOT, 'data', 'service.json'), encoding='utf-8'))['jobs'])
STATS = {'health', 'mood', 'ability', 'social', 'savings_months', 'debt_months', 'home_afford',
         'hometown_afford', 'mortgage_burden'}
LIVING = {'with_parents', 'shared', 'rent', 'own'}
RELATIONSHIPS = {'single', 'dating', 'married'}
SCENARIOS = {'expansion', 'contraction', 'ai_wave', 'property_boom', 'property_slump'}
EFFECT_KEYS = {
    'health', 'mood', 'ability', 'social', 'money', 'flags_add', 'flags_remove', 'module_start',
    'module_end', 'path', 'sub', 'exit_reason', 'record', 'level', 'income_mult', 'roommate_close',
    'modifier', 'text', 'company', 'relationship', 'living', 'kids', 'buy_home', 'sell_home', 'prepay', 'parent_health',
}
OPTION_KEYS = {'label', 'hint', 'p', 'success', 'fail', 'effects', 'unlock', 'followups', 'auto'}
VARS = {
    'last_job.entity', 'last_job.years', 'last_job.level', 'exit_reason', 'gap_months', 'severance',
    'record.type', 'next_path', 'n', 'name', 'ta', 'entity', 'place', 'school', 'city', 'amount', 'p', 'company',
}
PATHS = {
    'bigtech', 'whitecollar', 'public', 'service', 'founder', 'freelance', 'unemployed', 'study',
    'factory', 'creator', 'crime', 'exam', 'flat', 'grey', 'special',
}
DOMAINS = {'love', 'family', 'money', 'roommates', 'housing', 'body', 'mind', 'migration', 'hobby'}
LEGAL_PATHS = {'crime', 'grey'}
# Flags and modules maintained by the engine (documented in events/README.md), not set by events.
ENGINE_FLAGS = {
    'fresh_grad', 'seeking_bigtech', 'signed_intent', 'multiple_offers', 'job_seeking', 'interviewing',
    'has_offer', 'background_check', 'on_probation', 'promo_eligible', 'promo_passed', 'has_car',
    'owns_home', 'startup_options', 'ui_under_one_year', 'module_quit', 'roommate_released',
    'roommate_was_bigtech', 'only_child', 'parents_helped', 'hometown_home', 'wc_private', 'wc_foreign', 'wc_soe',
}
ENGINE_FLAG_PREFIXES = ('entity_',)
ENGINE_MODULES = {'mortgage'}
CMP = re.compile(r'^(<=|>=|==|<|>)-?\d+(\.\d+)?$')
VAR = re.compile(r'\{([^}]*)\}')

errors, warnings = [], []


def err(eid, msg):
    errors.append('%s: %s' % (eid, msg))


def warn(eid, msg):
    warnings.append('%s: %s' % (eid, msg))


def text_len(s):
    return len(VAR.sub('', s))


def check_vars(eid, s):
    for v in VAR.findall(s):
        if v not in VARS:
            err(eid, 'unknown variable {%s}' % v)


def season_months(v):
    if not v:
        return set()
    return {m for s in (v if isinstance(v, list) else [v]) for m in SEASONS.get(s, [])}


def check_when(eid, when):
    if not isinstance(when, dict):
        err(eid, 'when must be an object'); return
    for k, v in when.items():
        if k not in WHEN_KEYS:
            err(eid, 'unknown when key "%s"' % k)
        if k == 'stat':
            for s, c in v.items():
                if s not in STATS:
                    err(eid, 'unknown stat "%s"' % s)
                if not CMP.match(str(c)):
                    err(eid, 'bad comparison "%s" for %s' % (c, s))
        if k == 'living':
            for x in (v if isinstance(v, list) else [v]):
                if x not in LIVING:
                    err(eid, 'unknown living "%s"' % x)
        if k == 'relationship':
            for x in (v if isinstance(v, list) else [v]):
                if x not in RELATIONSHIPS:
                    err(eid, 'unknown relationship "%s"' % x)
        if k == 'season':
            for x in (v if isinstance(v, list) else [v]):
                if x not in SEASONS:
                    err(eid, 'unknown season "%s"' % x)
        if k == 'scenario' and v not in SCENARIOS:
            err(eid, 'unknown scenario "%s"' % v)
        if k == 'sub':
            for x in (v if isinstance(v, list) else [v]):
                if x not in SUBS:
                    err(eid, 'unknown sub "%s"' % x)
        if k in ('level', 'gap_months', 'degree', 'school_tier', 'family_tier', 'city_tier', 'year', 'kids',
                 'parent_age', 'tenure', 'age') and not CMP.match(str(v)):
            err(eid, 'bad comparison "%s" for %s' % (v, k))
        if k == 'history_months':
            for p, c in v.items():
                if p not in PATHS or not CMP.match(str(c)):
                    err(eid, 'bad history_months %s %s' % (p, c))
        if k in ('path', 'not_path', 'history_any'):
            for p in (v if isinstance(v, list) else [v]):
                if p not in PATHS:
                    err(eid, 'unknown path "%s" in %s' % (p, k))


def check_effects(eid, eff):
    if not isinstance(eff, dict):
        err(eid, 'effects must be an object'); return
    for k in eff:
        if k not in EFFECT_KEYS:
            err(eid, 'unknown effect key "%s"' % k)
    if isinstance(eff.get('money'), str):
        _, problem = formula.parse(eff['money'])
        if problem:
            err(eid, 'money formula %s' % problem)
    if 'living' in eff and eff['living'] not in LIVING:
        err(eid, 'effect sets unknown living "%s"' % eff['living'])
    if 'relationship' in eff and eff['relationship'] not in RELATIONSHIPS:
        err(eid, 'effect sets unknown relationship "%s"' % eff['relationship'])
    if 'buy_home' in eff and eff['buy_home'] not in ('city', 'hometown'):
        err(eid, 'buy_home must be "city" or "hometown"')
    if 'prepay' in eff and not 0 < eff['prepay'] <= 1:
        err(eid, 'prepay must be a share of savings in (0, 1]')
    if 'sub' in eff and eff['sub'] not in SUBS:
        err(eid, 'effect sets unknown sub "%s"' % eff['sub'])
    if 'path' in eff and eff['path'] not in PATHS:
        err(eid, 'effect switches to unknown path "%s"' % eff['path'])
    if 'text' in eff:
        if text_len(eff['text']) > 60:
            err(eid, 'outcome text over 60 chars')
        check_vars(eid, eff['text'])


def check_probability(eid, what, value):
    if isinstance(value, (int, float)):
        if not 0 < value <= 1:
            err(eid, '%s must be in (0, 1]' % what)
        return
    _, problem = formula.parse(value)
    if problem:
        err(eid, '%s formula %s' % (what, problem))
        return
    lo, hi = formula.sample_range(value)
    if lo < 0 or hi > 1:
        err(eid, '%s formula leaves 0–1 for typical states (%.3f to %.3f)' % (what, lo, hi))


def load_seeds(kind, name):
    """Seed names from the first column of '| 种子' tables in the dossier."""
    path = os.path.join(ROOT, 'research', 'paths' if kind == 'path' else 'domains', name + '.md')
    seeds, in_seed = set(), False
    if not os.path.exists(path):
        return None
    for line in open(path, encoding='utf-8'):
        if line.startswith('| 种子'):
            in_seed = True; continue
        if in_seed:
            if line.startswith('| ---'):
                continue
            if line.startswith('|'):
                seeds.add(line.split('|')[1].strip())
            else:
                in_seed = False
    return seeds


def main():
    sources = json.load(open(os.path.join(ROOT, 'data', 'sources.json'), encoding='utf-8'))
    src, helps = sources['sources'], sources['help']
    events, ids = [], {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'events', '**', '*.json'), recursive=True)):
        try:
            data = json.load(open(f, encoding='utf-8'))
        except ValueError as e:
            errors.append('%s: invalid JSON (%s)' % (os.path.relpath(f, ROOT), e)); continue
        for ev in data:
            ev['_file'] = os.path.relpath(f, ROOT)
            events.append(ev)
            eid = ev.get('id', '?')
            if eid in ids:
                err(eid, 'duplicate id (also in %s)' % ids[eid])
            ids[eid] = ev['_file']

    used = {}
    for ev in events:
        eid = ev.get('id', '?')
        for k in ('id', 'seed', 'type', 'age', 'text'):
            if k not in ev:
                err(eid, 'missing %s' % k)
        owner = ev.get('path') or ev.get('domain')
        if bool(ev.get('path')) == bool(ev.get('domain')):
            err(eid, 'needs exactly one of path / domain')
        elif ev.get('path') and ev['path'] not in PATHS or ev.get('domain') and ev['domain'] not in DOMAINS:
            err(eid, 'unknown owner %s' % owner)
        if not eid.startswith(str(owner) + '.'):
            err(eid, 'id must start with "%s."' % owner)
        if ev.get('type') not in TYPES:
            err(eid, 'bad type %s' % ev.get('type'))
        age = ev.get('age', [0, 0])
        if not (isinstance(age, list) and len(age) == 2 and 22 <= age[0] <= age[1] <= 35):
            err(eid, 'age must be [lo, hi] within 22–35')
        triggers = [k for k in ('chance', 'weight', 'trigger') if k in ev]
        if len(triggers) != 1:
            err(eid, 'needs exactly one of chance / weight / trigger')
        if 'chance' in ev:
            check_probability(eid, 'chance', ev['chance'])
        if ev.get('trigger') not in (None, 'follow', 'path_change'):
            err(eid, 'trigger must be "follow" or "path_change"')
        if ev.get('trigger') == 'path_change':
            tr = ev.get('transition')
            if not isinstance(tr, dict) or not tr or any(k not in ('from', 'to') or v not in PATHS for k, v in tr.items()):
                err(eid, 'path_change needs transition {from, to} with known paths')
        elif 'transition' in ev:
            err(eid, 'transition only applies to trigger "path_change"')
        texts = ev.get('text', [])
        if not texts:
            err(eid, 'text is empty')
        for t in texts:
            if text_len(t.get('t', '')) > 60:
                err(eid, 'text over 60 chars: %s' % t.get('t'))
            check_vars(eid, t.get('t', ''))
            if 'when' in t:
                check_when(eid, t['when'])
        # in every month the event can fire, some text variant must fit the season
        ev_months = season_months(ev.get('when', {}).get('season')) or set(range(1, 13))
        text_months = set()
        for t in texts:
            text_months |= season_months(t.get('when', {}).get('season')) or set(range(1, 13))
        if texts and not ev_months <= text_months:
            err(eid, 'no text fits months %s (give the event a season or add an all-year text)'
                % sorted(ev_months - text_months))
        if len(texts) < 2 and ev.get('type') in ('daily', 'chain'):
            warn(eid, 'only one text variant')
        if 'when' in ev:
            check_when(eid, ev['when'])
        if 'effects' in ev:
            check_effects(eid, ev['effects'])
        fact = ev.get('fact')
        if fact:
            if 'year' in fact and not (isinstance(fact['year'], int) and 2014 <= fact['year'] <= 2027):
                err(eid, 'fact year must be an integer 2014-2027')
            if text_len(fact.get('text', '')) > 40:
                err(eid, 'fact over 40 chars')
            s = src.get(fact.get('source'))
            if not s:
                err(eid, 'unknown fact source %s' % fact.get('source'))
            elif s['label'] != 'data':
                err(eid, 'fact source %s is a report, not data' % fact.get('source'))
        for h in ev.get('help', []):
            if h not in helps:
                err(eid, 'unknown help channel %s' % h)
        if owner in LEGAL_PATHS and ev.get('review') != 'legal':
            err(eid, 'crime/grey events need "review": "legal"')
        opts = ev.get('options')
        if ev.get('type') == 'choice':
            if not opts or not 2 <= len(opts) <= 5:
                err(eid, 'choice needs 2–5 options')
        elif opts:
            err(eid, 'only choice events may have options')
        for o in opts or []:
            for k in o:
                if k not in OPTION_KEYS:
                    err(eid, 'unknown option key "%s"' % k)
            if text_len(o.get('label', '')) > 16:
                err(eid, 'option label over 16 chars: %s' % o.get('label'))
            if text_len(o.get('hint', '')) > 30:
                err(eid, 'option hint over 30 chars: %s' % o.get('hint'))
            check_vars(eid, o.get('label', '') + o.get('hint', ''))
            if 'auto' in o and not (isinstance(o['auto'], (int, float)) and o['auto'] > 0):
                err(eid, 'option auto weight must be a positive number')
            if 'p' in o:
                check_probability(eid, 'option p', o['p'])
            if 'p' in o and not ('success' in o and 'fail' in o):
                err(eid, 'option with p needs success and fail')
            for k in ('success', 'fail', 'effects'):
                if k in o:
                    check_effects(eid, o[k])
            if 'unlock' in o:
                check_when(eid, o['unlock'])
        for fu in ev.get('followups', []) + [fu for o in opts or [] for fu in o.get('followups', [])]:
            if fu.get('id') not in ids and fu.get('id') not in {e.get('id') for e in events}:
                err(eid, 'followup to unknown id %s' % fu.get('id'))
            for k in fu:
                if k not in ('id', 'delay', 'delay_months', 'chance'):
                    err(eid, 'unknown followup key "%s"' % k)
        used.setdefault((('path' if ev.get('path') else 'domain'), owner), set()).add(ev.get('seed'))

    required, provided = {}, set(ENGINE_FLAGS)
    req_mods, started = {}, set(ENGINE_MODULES)

    def scan_when(eid, w):
        if isinstance(w, dict):
            for f in w.get('flags', []) + w.get('not_flags', []):
                required.setdefault(f, eid)
            for k in ('module', 'not_module'):
                if k in w:
                    req_mods.setdefault(w[k], eid)

    def scan_eff(e):
        if isinstance(e, dict):
            provided.update(e.get('flags_add', []))
            if 'module_start' in e:
                started.add(e['module_start'])

    for ev in events:
        scan_when(ev['id'], ev.get('when'))
        for t in ev.get('text', []):
            scan_when(ev['id'], t.get('when'))
        scan_eff(ev.get('effects'))
        for o in ev.get('options') or []:
            scan_when(ev['id'], o.get('unlock'))
            for k in ('effects', 'success', 'fail'):
                scan_eff(o.get(k))
    for f, eid in sorted(required.items()):
        if f not in provided and not f.startswith(ENGINE_FLAG_PREFIXES):
            err(eid, 'flag "%s" is required but never set (add an event or list it in ENGINE_FLAGS)' % f)
    for m, eid in sorted(req_mods.items()):
        if m not in started:
            err(eid, 'module "%s" is required but never started' % m)

    for ev in events:
        if ev.get('trigger') == 'follow':
            eid = ev['id']
            referenced = any(fu.get('id') == eid for e in events
                             for fu in e.get('followups', []) + [f for o in e.get('options') or [] for f in o.get('followups', [])])
            if not referenced:
                warn(eid, 'trigger "follow" but nothing points to it')

    print('events: %d in %d owners' % (len(events), len(used)))
    for (kind, owner), seeds in sorted(used.items()):
        dossier = load_seeds(kind, owner)
        if dossier is None:
            print('  %s: no dossier' % owner); continue
        unknown = sorted(s for s in seeds if s not in dossier)
        for s in unknown:
            errors.append('%s: seed "%s" is not in the dossier' % (owner, s))
        missing = sorted(dossier - seeds)
        n = sum(1 for e in events if (e.get('path') or e.get('domain')) == owner)
        print('  %-12s %3d events, seeds covered %d/%d' % (owner, n, len(dossier & seeds), len(dossier)))
        if missing:
            print('    not yet covered: ' + '、'.join(missing))
    for w in warnings:
        print('WARN  ' + w)
    for e in errors:
        print('ERROR ' + e)
    print('%d errors, %d warnings' % (len(errors), len(warnings)))
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
