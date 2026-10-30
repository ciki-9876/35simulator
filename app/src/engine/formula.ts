// Evaluates event formulas (chance, option p, money). Vocabulary is the "公式" section of
// events/README.md; tools/formula.py validates formulas at lint time, so this parser only needs to run
// valid ones. No eval(): formulas are parsed into closures and cached.

export interface FormulaEnv {
  values: Record<string, number>
  flag: (name: string) => number
  module: (name: string) => number
  mod: (name: string) => number
}

type Node = (env: FormulaEnv) => number
type Token = { kind: 'num'; value: number } | { kind: 'str'; value: string } | { kind: 'name'; value: string } | { kind: 'op'; value: string }

const cache = new Map<string, Node>()

export function evaluate(expr: number | string, env: FormulaEnv): number {
  if (typeof expr === 'number') return expr
  let node = cache.get(expr)
  if (!node) {
    node = compile(expr)
    cache.set(expr, node)
  }
  return node(env)
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ') {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      tokens.push({ kind: 'num', value: parseFloat(src.slice(i, j)) })
      i = j
    } else if (c === '"' || c === "'") {
      const j = src.indexOf(c, i + 1)
      tokens.push({ kind: 'str', value: src.slice(i + 1, j) })
      i = j + 1
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++
      tokens.push({ kind: 'name', value: src.slice(i, j) })
      i = j
    } else if ('+-*/(),'.includes(c)) {
      tokens.push({ kind: 'op', value: c })
      i++
    } else {
      throw new Error(`unexpected "${c}" in formula ${src}`)
    }
  }
  return tokens
}

function compile(src: string): Node {
  const tokens = tokenize(src)
  let pos = 0
  const peek = () => tokens[pos]
  const isOp = (v: string) => peek()?.kind === 'op' && peek().value === v
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`expected "${v}" in formula ${src}`)
    pos++
  }

  function expr(): Node {
    let left = term()
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value
      const l = left, r = term()
      left = op === '+' ? env => l(env) + r(env) : env => l(env) - r(env)
    }
    return left
  }

  function term(): Node {
    let left = unary()
    while (isOp('*') || isOp('/')) {
      const op = tokens[pos++].value
      const l = left, r = unary()
      left = op === '*' ? env => l(env) * r(env) : env => l(env) / r(env)
    }
    return left
  }

  function unary(): Node {
    if (isOp('-')) {
      pos++
      const v = unary()
      return env => -v(env)
    }
    if (isOp('+')) {
      pos++
      return unary()
    }
    return primary()
  }

  function primary(): Node {
    const t = tokens[pos++]
    if (!t) throw new Error(`unexpected end of formula ${src}`)
    if (t.kind === 'num') {
      const v = t.value
      return () => v
    }
    if (t.kind === 'op' && t.value === '(') {
      const v = expr()
      expect(')')
      return v
    }
    if (t.kind === 'name') {
      const name = t.value
      if (!isOp('(')) return env => env.values[name] ?? 0
      pos++
      if (name === 'flag' || name === 'module' || name === 'mod') {
        const arg = tokens[pos++]
        if (arg?.kind !== 'str') throw new Error(`${name}() takes a quoted name in ${src}`)
        expect(')')
        const key = arg.value
        return env => env[name](key)
      }
      const args: Node[] = [expr()]
      while (isOp(',')) {
        pos++
        args.push(expr())
      }
      expect(')')
      if (name === 'max') return env => Math.max(...args.map(a => a(env)))
      if (name === 'min') return env => Math.min(...args.map(a => a(env)))
      throw new Error(`unknown function ${name} in ${src}`)
    }
    throw new Error(`unexpected token in formula ${src}`)
  }

  const root = expr()
  if (pos !== tokens.length) throw new Error(`trailing tokens in formula ${src}`)
  return root
}
