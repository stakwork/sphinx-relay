import { sphinxLogger } from './logger'
import { Response } from 'express'

// eslint-disable-next-line @typescript-eslint/ban-types
export function success(res: Response, json: {} | string): void {
  res.status(200)
  res.json({
    success: true,
    response: json,
  })
  res.end()
}

export function failure(res: Response, e: Error | string): void {
  const errorMessage = typeof e === 'string' ? e : e.message
  sphinxLogger.error(`--> failure: ${errorMessage}`)
  res.status(400)
  res.json({
    success: false,
    error: errorMessage,
  })
  res.end()
}

export function failure200(res: Response, e: Error | string): void {
  res.status(200)
  res.json({
    success: false,
    error: typeof e === 'string' ? e : e.message,
  })
  res.end()
}

export function unauthorized(res: Response): void {
  res.writeHead(401, 'Access invalid for user', {
    'Content-Type': 'text/plain',
  })
  res.end('invalid credentials')
}
