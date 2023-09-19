export function errMsgString(error: Error | string | null): string {
  let errMsg = ''
  if (!error) return 'failure'
  if (typeof error === 'string') {
    errMsg = error
  } else if (error.toString) {
    errMsg = error.toString()
  } else {
    errMsg = error?.message
  }
  if (errMsg === 'FAILURE_REASON_NO_ROUTE') {
    errMsg = 'no route found'
  }
  if (errMsg === 'FAILURE_REASON_INSUFFICIENT_BALANCE') {
    errMsg = 'insufficient balance'
  }
  if (errMsg === 'FAILURE_REASON_INCORRECT_PAYMENT_DETAILS') {
    errMsg = 'incorrect payment details'
  }
  return errMsg
}
