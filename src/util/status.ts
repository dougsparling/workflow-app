import type { ThemeTokens } from '@design/theme'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export type ExecutionStatus =
  | 'running'
  | 'complete'
  | 'pending'
  | 'failed'
  | 'idle'
  | 'stopped'
  | 'aborted'

export type StatusColors = {
  bg: string
  border: string
  text: string
  dot: string
}

export function getStatusColors(tokens: ThemeTokens, status: ExecutionStatus): StatusColors {
  switch (status) {
    case 'running':
      return { bg: tokens.statusRunningGhost, border: tokens.statusRunningBorder, text: tokens.statusRunning, dot: tokens.statusRunning }
    case 'complete':
      return { bg: tokens.accentGhost, border: tokens.accentBorder, text: tokens.statusComplete, dot: tokens.statusComplete }
    case 'pending':
      return { bg: tokens.amberGhost, border: tokens.amberBorder, text: tokens.amberBase, dot: tokens.amberBase }
    case 'failed':
      return { bg: tokens.errorGhost, border: tokens.errorBorder, text: tokens.errorBright, dot: tokens.errorBase }
    case 'idle':
    case 'stopped':
    case 'aborted':
    default:
      return { bg: tokens.statusIdleGhost, border: tokens.statusIdleBorder, text: tokens.textMuted, dot: tokens.textMuted }
  }
}

export function logLevelColor(level: LogLevel, tokens: ThemeTokens): string {
  switch (level) {
    case 'INFO':  return tokens.accentBase
    case 'WARN':  return tokens.amberBase
    case 'ERROR': return tokens.errorBright
    case 'DEBUG': return tokens.textMuted
  }
}
