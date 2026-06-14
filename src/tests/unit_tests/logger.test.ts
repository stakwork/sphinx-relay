jest.mock('../../utils/config', () => ({
  loadConfig: () => ({
    logging: '',
    logging_level: 'info',
  }),
}))

import { timestampConsoleArgs } from '../../utils/logger'

describe('tests for src/utils/logger.ts', () => {
  const timestamp = new Date(2026, 5, 14, 12, 0, 0)

  test('prefixes string console messages with a timestamp', () => {
    const args = timestampConsoleArgs(['hello', 'world'], timestamp)

    expect(args).toStrictEqual(['-> 2026-06-14 12:00:00: hello', 'world'])
  })

  test('adds a timestamp argument before non-string console messages', () => {
    const data = { ok: true }
    const args = timestampConsoleArgs([data], timestamp)

    expect(args).toStrictEqual(['-> 2026-06-14 12:00:00:', data])
  })

  test('does not prefix existing express logger timestamps again', () => {
    const args = ['-> 2026-06-14 12:00:00: POST /messages 200 71ms']

    expect(timestampConsoleArgs(args, timestamp)).toBe(args)
  })

  test('does not prefix existing sphinx logger timestamps again', () => {
    const args = ['26-06-14T12:00:00', '[MISC]', 'hello']

    expect(timestampConsoleArgs(args, timestamp)).toBe(args)
  })
})
