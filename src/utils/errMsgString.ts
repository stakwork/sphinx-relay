export function errMsgString(error) {
  let errMsg = ''
  if (typeof error === 'string') {
    errMsg = error
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
