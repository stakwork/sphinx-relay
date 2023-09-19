import { Res } from '../types'
import { sphinxLogger } from './logger'

function success(res: Res, json) {
  res.status(200)
  res.json({
    success: true,
    response: json,
  })
  res.end()
}

function failure(res: Res, e) {
  const errorMessage = (e && e.message) || e
  sphinxLogger.error(`--> failure: ${errorMessage}`)
  res.status(400)
  res.json({
    success: false,
    error: errorMessage,
  })
  res.end()
}

function failureWithResponse(res: Res, e, json) {
  const errorMessage = (e && e.message) || e
  // sphinxLogger.error(`--> failure: ${errorMessage}`)
  res.status(400)
  res.json({
    success: false,
    error: errorMessage,
    response: json,
  })
  res.end()
}

function failure200(res: Res, e) {
  res.status(200)
  res.json({
    success: false,
    error: (e && e.message) || e,
  })
  res.end()
}

function unauthorized(res: Res) {
  res.status(401)
  res.json({ success: false, error: 'Invalid credentials' })
  res.end()
}

export { success, failure, failure200, unauthorized, failureWithResponse }
