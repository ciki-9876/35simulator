# -*- coding: utf-8 -*-
"""Formula strings used by events (chance, option p, money). See the "公式" section of events/README.md.

A formula is parsed once into a Python AST, checked against a whitelist, and evaluated against a dict of
values plus the helper functions flag(), module(), mod(), max() and min().
"""
import ast

NUMBERS = {'age', 'level', 'tenure', 'gap_months', 'ability', 'mood', 'health', 'social',
           'income', 'monthly', 'living', 'city_tier', 'savings', 'kids', 'parent_age', 'parent_health',
           'mortgage', 'home_value', 'down_payment'}
FUNCTIONS = {'flag', 'module', 'mod', 'max', 'min'}
MODIFIERS = {'job_success', 'layoff', 'promo', 'bigtech_interview', 'ban_same_type', 'shop_risk'}
# Python < 3.8 parses literals as Num / Str instead of Constant.
_LITERALS = tuple(getattr(ast, n) for n in ('Constant', 'Num', 'Str') if hasattr(ast, n))
_NODES = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Add, ast.Sub, ast.Mult, ast.Div,
          ast.USub, ast.UAdd, ast.Name, ast.Load, ast.Call) + _LITERALS


def _literal(node):
    """Value of a literal node, or None when the node is not a literal."""
    if not isinstance(node, _LITERALS):
        return None
    for attr in ('value', 'n', 's'):
        if hasattr(node, attr):
            return getattr(node, attr)
    return None


_cache = {}


def parse(text):
    """Returns (code, None) for a valid formula or (None, error message)."""
    if text in _cache:
        return _cache[text]
    try:
        tree = ast.parse(str(text), mode='eval')
    except SyntaxError as e:
        result = (None, 'syntax error: %s' % e.msg)
    else:
        result = (compile(tree, '<formula>', 'eval'), None)
        for node in ast.walk(tree):
            if not isinstance(node, _NODES):
                result = (None, 'not allowed: %s' % type(node).__name__)
                break
            if isinstance(node, ast.Name) and node.id not in NUMBERS | FUNCTIONS:
                result = (None, 'unknown name "%s"' % node.id)
                break
            if isinstance(node, _LITERALS) and not isinstance(_literal(node), (int, float, str)):
                result = (None, 'bad constant %r' % _literal(node))
                break
            if isinstance(node, ast.Call):
                if not isinstance(node.func, ast.Name) or node.func.id not in FUNCTIONS or node.keywords:
                    result = (None, 'only flag/module/mod/max/min may be called')
                    break
                if node.func.id in ('flag', 'module', 'mod'):
                    if len(node.args) != 1 or not isinstance(_literal(node.args[0]), str):
                        result = (None, '%s() takes one quoted name' % node.func.id)
                        break
                    if node.func.id == 'mod' and _literal(node.args[0]) not in MODIFIERS:
                        result = (None, 'unknown modifier "%s"' % _literal(node.args[0]))
                        break
    _cache[text] = result
    return result


def evaluate(text, values, flags=(), modules=(), modifier=lambda key: 1.0):
    """Evaluates a formula; numbers pass through unchanged."""
    if isinstance(text, (int, float)):
        return float(text)
    code, error = parse(text)
    if error:
        raise ValueError(error)
    env = dict(values)
    env.update(flag=lambda f: 1.0 if f in flags else 0.0,
               module=lambda m: 1.0 if m in modules else 0.0,
               mod=modifier, max=max, min=min)
    return float(eval(code, {'__builtins__': {}}, env))


def sample_range(text):
    """Evaluates a formula over typical states; returns (lowest, highest) for range checks."""
    lo, hi = float('inf'), float('-inf')
    for age in (22, 28, 35):
        for stat in (0, 50, 100):
            for on, mult in ((False, 1.0), (True, 3.0)):
                values = {'age': age, 'level': 1 + (age - 22) // 3, 'tenure': age - 22, 'gap_months': 6,
                          'ability': stat, 'mood': stat, 'health': stat, 'social': stat,
                          'income': 300000, 'monthly': 25000, 'living': 5000, 'city_tier': 3, 'savings': 100000,
                          'kids': 1, 'parent_age': 30 + age, 'parent_health': stat, 'mortgage': 6000,
                          'home_value': 1500000, 'down_payment': 400000}
                code, _ = parse(text)
                names = {_literal(n.args[0]) for n in ast.walk(ast.parse(str(text), mode='eval'))
                         if isinstance(n, ast.Call) and getattr(n.func, 'id', '') in ('flag', 'module')}
                v = evaluate(text, values, flags=names if on else (), modules=names if on else (),
                             modifier=lambda key: mult)
                lo, hi = min(lo, v), max(hi, v)
    return lo, hi
