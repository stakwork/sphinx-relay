import { make, parse } from '../../utils/cron'
import * as parser from 'cron-parser'

describe('Testing the cron job time function', () => {
  const now = new Date()
  const minute = now.getMinutes()
  const hour = now.getHours()
  const dayOfMonth = now.getDate()
  const dayOfWeek = now.getDay()

  test('Testing Cron Jobs time', () => {
    expect(make('daily')).toStrictEqual(`${minute} ${hour} * * *`)
    expect(make('weekly')).toStrictEqual(`${minute} ${hour} * * ${dayOfWeek}`)
    expect(make('monthly')).toStrictEqual(`${minute} ${hour} ${dayOfMonth} * *`)
  })

  function parseNext(s) {
    const interval = parser.parseExpression(s)
    return interval.next().toString()
  }
  const daily = '40 4 * * *'
  const weekly = '45 3 * * 4'
  const monthly = '50 2 5 * *'

  test('Parsing Cron string', () => {
    expect(parse(daily)).toStrictEqual({
      interval: 'daily',
      next: parseNext(daily),
      ms: 86400000,
    })

    expect(parse(weekly)).toStrictEqual({
      interval: 'weekly',
      next: parseNext(weekly),
      ms: 86400000 * 7,
    })

    expect(parse(monthly)).toStrictEqual({
      interval: 'monthly',
      next: parseNext(monthly),
      ms: 86400000 * 30,
    })
  })
})
