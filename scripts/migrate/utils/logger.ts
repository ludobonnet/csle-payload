/**
 * Migration logger with progress tracking
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

interface ProgressState {
  current: number
  total: number
  label: string
}

let progressState: ProgressState | null = null

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function formatTime(): string {
  return new Date().toISOString().substring(11, 19)
}

function formatLevel(level: LogLevel): string {
  switch (level) {
    case 'info':
      return `${colors.blue}INFO${colors.reset}`
    case 'warn':
      return `${colors.yellow}WARN${colors.reset}`
    case 'error':
      return `${colors.red}ERROR${colors.reset}`
    case 'success':
      return `${colors.green}OK${colors.reset}`
    case 'debug':
      return `${colors.dim}DEBUG${colors.reset}`
  }
}

export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = `${colors.dim}[${formatTime()}]${colors.reset}`
  const levelStr = formatLevel(level)
  let output = `${timestamp} ${levelStr} ${message}`

  if (data !== undefined) {
    if (typeof data === 'object') {
      output += ` ${colors.dim}${JSON.stringify(data)}${colors.reset}`
    } else {
      output += ` ${colors.dim}${data}${colors.reset}`
    }
  }

  console.log(output)
}

export function info(message: string, data?: unknown): void {
  log('info', message, data)
}

export function warn(message: string, data?: unknown): void {
  log('warn', message, data)
}

export function error(message: string, data?: unknown): void {
  log('error', message, data)
}

export function success(message: string, data?: unknown): void {
  log('success', message, data)
}

export function debug(message: string, data?: unknown): void {
  if (process.env.DEBUG === 'true') {
    log('debug', message, data)
  }
}

export function startProgress(label: string, total: number): void {
  progressState = { current: 0, total, label }
  updateProgress()
}

export function updateProgress(increment = 0): void {
  if (!progressState) return

  progressState.current += increment
  const percent = Math.round((progressState.current / progressState.total) * 100)
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5))

  process.stdout.write(
    `\r${colors.cyan}${progressState.label}${colors.reset} [${bar}] ${progressState.current}/${progressState.total} (${percent}%)`,
  )
}

export function endProgress(): void {
  if (progressState) {
    console.log() // New line after progress bar
    progressState = null
  }
}

export function section(title: string): void {
  console.log()
  console.log(`${colors.bright}${colors.cyan}═══ ${title} ═══${colors.reset}`)
  console.log()
}

export function summary(title: string, stats: Record<string, number | string>): void {
  console.log()
  console.log(`${colors.bright}${title}${colors.reset}`)
  for (const [key, value] of Object.entries(stats)) {
    console.log(`  ${colors.dim}${key}:${colors.reset} ${value}`)
  }
  console.log()
}
