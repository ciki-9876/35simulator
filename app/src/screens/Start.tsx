import { useState } from 'preact/hooks'
import { newSeed, parseSeed, seedCode } from '../data'
import type { Save } from '../save'

export function Start({ save, onStart, onResume }: { save: Save | null; onStart: (s: number) => void; onResume: (s: Save) => void }) {
  const [code, setCode] = useState('')
  const parsed = code ? parseSeed(code) : null
  return (
    <main class="start">
      <h1>同届生</h1>
      <p class="sub">2014 届 · 从 22 岁毕业到 35 岁 · 和三个室友比一比</p>
      <div class="start-actions">
        <button class="primary" onClick={() => onStart(parsed ?? newSeed())}>
          {parsed !== null ? `用种子 ${seedCode(parsed)} 开始` : '抽一张毕业卡'}
        </button>
        {save && (
          <button onClick={() => onResume(save)}>
            继续上一局（{seedCode(save.seed)} · {22 + Math.floor(save.elapsed / 12)} 岁）
          </button>
        )}
      </div>
      <label class="seed-input">
        种子码（可选）
        <input value={code} maxLength={8} placeholder="例如 3F9K2A" onInput={e => setCode((e.target as HTMLInputElement).value)} />
      </label>
      <p class="note">
        演示版 · 内容仍在扩充，目前已写大厂、待业、违法三条路线；2026 年 11 月以后的时代背景为推演。
        院校和公司用外号，平行世界，如有雷同纯属玩梗。
      </p>
    </main>
  )
}
