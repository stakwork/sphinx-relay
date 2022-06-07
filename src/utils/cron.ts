import * as parser from 'cron-parser'

type Interval = 'daily' | 'weekly' | 'monthly';

// a day in milliseconds
const day = 24 * 60 * 60 * 1000;

function daily(): string {
  const now = new Date()
  const minute = now.getMinutes()
  const hour = now.getHours()
  return `${minute} ${hour} * * *`
}

function weekly(): string {
  const now = new Date()
  const minute = now.getMinutes()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  return `${minute} ${hour} * * ${dayOfWeek}`
}

function monthly(): string {
  const now = new Date()
  const minute = now.getMinutes()
  const hour = now.getHours()
  const dayOfMonth = now.getDate()
  return `${minute} ${hour} ${dayOfMonth} * *`
}

export function parse(s: string): { interval: Interval, next: string, ms: number } {
  const next = parser.parseExpression(s).next().toString()

  if (s.endsWith(' * * *')) {
    return { interval: 'daily', next, ms: day }
  }
  if (s.endsWith(' * *')) {
    return { interval: 'monthly', next, ms: day * 30 }
  }
  return { interval: 'weekly', next, ms: day * 7 }
}

export function make(interval: Interval): string {
  if (interval === 'daily') return daily()
  if (interval === 'weekly') return weekly()
  if (interval === 'monthly') return monthly()
  throw new Error('Invalid interval')
}
