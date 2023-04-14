export function errMsgString(error) {
  let errMsg = ''
  if (typeof error === 'string') {
    errMsg = error
  } else {
    errMsg = error?.message
  }
  return errMsg
}
