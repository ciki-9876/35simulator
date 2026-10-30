// Share images (毕业卡 / 结局卡), drawn in the browser on a canvas and saved as PNG. Every card carries
// the seed code so a friend can play the same hand.
export interface CardSpec {
  kicker: string
  title: string
  subtitle?: string
  rows: [string, string][]
  footer: string
  accent: string
}

const W = 720, PAD = 48

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > width && line) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
}

export function drawCard(spec: CardSpec): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = (size: number, weight = 400) => `${weight} ${size}px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
  // measure first, then draw at the final height
  ctx.font = font(22)
  const rowLines = spec.rows.map(([, v]) => wrap(ctx, v, W - PAD * 2 - 140))
  ctx.font = font(22)
  const subLines = spec.subtitle ? wrap(ctx, spec.subtitle, W - PAD * 2) : []
  const H = PAD + 30 + 60 + subLines.length * 32 + 30 + rowLines.reduce((a, l) => a + l.length * 32 + 16, 0) + 80 + PAD
  canvas.width = W
  canvas.height = H
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = spec.accent
  ctx.fillRect(0, 0, W, 10)
  let y = PAD + 24
  ctx.fillStyle = '#7a756b'
  ctx.font = font(20)
  ctx.fillText(spec.kicker, PAD, y)
  y += 56
  ctx.fillStyle = '#23211d'
  ctx.font = font(40, 700)
  ctx.fillText(spec.title, PAD, y)
  y += 16
  ctx.font = font(22)
  ctx.fillStyle = '#4a463f'
  for (const l of subLines) { y += 32; ctx.fillText(l, PAD, y) }
  y += 30
  spec.rows.forEach(([label, ], i) => {
    ctx.strokeStyle = '#e3ded2'
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    y += 32
    ctx.fillStyle = '#7a756b'
    ctx.font = font(20)
    ctx.fillText(label, PAD, y)
    ctx.fillStyle = '#23211d'
    ctx.font = font(22)
    rowLines[i].forEach((l, j) => ctx.fillText(l, PAD + 140, y + j * 32))
    y += (rowLines[i].length - 1) * 32 + 16
  })
  y += 40
  ctx.fillStyle = spec.accent
  ctx.font = font(20, 600)
  ctx.fillText(spec.footer, PAD, y)
  ctx.fillStyle = '#a39e93'
  ctx.font = font(16)
  ctx.fillText('平行世界，如有雷同纯属玩梗', PAD, y + 30)
  return canvas
}

export function saveCard(spec: CardSpec, filename: string): void {
  const canvas = drawCard(spec)
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = filename
  a.click()
}
