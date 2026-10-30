# -*- coding: utf-8 -*-
"""Compares the TypeScript engine's metrics with the Python reference simulator's.

Usage: python -X utf8 tools/parity.py [reports/metrics_py.json] [reports/metrics_ts.json]

Rates (shares of lives) must agree within 2 percentage points; per-year counts within 10% relative.
Per-event trigger rates are listed when they differ by more than 5 points, as hints for where the
engines disagree, but do not fail the check.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATES = ['jaccard', 'three_plus_paths', 'criminal', 'bigtech_laid_off']
COUNTS = ['events_per_year_written', 'choices_per_year_written']


def main():
    py_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'reports', 'metrics_py.json')
    ts_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'reports', 'metrics_ts.json')
    py, ts = (json.load(open(p, encoding='utf-8')) for p in (py_path, ts_path))
    failed = False
    print('%-26s %8s %8s  %s' % ('metric', 'python', 'ts', 'result'))
    for k in RATES:
        ok = abs(py[k] - ts[k]) <= 0.02
        failed |= not ok
        print('%-26s %7.1f%% %7.1f%%  %s' % (k, 100 * py[k], 100 * ts[k], 'ok' if ok else 'FAIL (>2pt)'))
    for k in COUNTS:
        ok = abs(py[k] - ts[k]) <= 0.1 * py[k]
        failed |= not ok
        print('%-26s %8.2f %8.2f  %s' % (k, py[k], ts[k], 'ok' if ok else 'FAIL (>10%)'))
    for p in sorted(set(py['ever_path']) | set(ts['ever_path'])):
        a, b = py['ever_path'].get(p, 0), ts['ever_path'].get(p, 0)
        ok = abs(a - b) <= 0.02
        failed |= not ok
        print('%-26s %7.1f%% %7.1f%%  %s' % ('ever_path.' + p, 100 * a, 100 * b, 'ok' if ok else 'FAIL (>2pt)'))
    diffs = sorted(((abs(py['fired_lives'][e] - ts['fired_lives'].get(e, 0)), e) for e in py['fired_lives']), reverse=True)
    big = [(d, e) for d, e in diffs if d > 0.05]
    print('\nevents whose trigger rate differs by more than 5 points: %d' % len(big))
    for d, e in big[:20]:
        print('  %-48s py %5.1f%%  ts %5.1f%%' % (e, 100 * py['fired_lives'][e], 100 * ts['fired_lives'].get(e, 0)))
    print('\n' + ('FAIL' if failed else 'PASS'))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
