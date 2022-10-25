import * as decodeUtils from './decode'

export function decodePaymentRequest(paymentRequest) {
  const decodedPaymentRequest: any = decodeUtils.decode(paymentRequest)
  let expirationSeconds = 3600
  let paymentHash = ''
  let memo = ''

  for (let i = 0; i < decodedPaymentRequest.data.tags.length; i++) {
    const tag = decodedPaymentRequest.data.tags[i]
    if (tag) {
      if (tag.description == 'payment_hash') {
        paymentHash = tag.value
      } else if (tag.description == 'description') {
        memo = tag.value
      } else if (tag.description == 'expiry') {
        expirationSeconds = tag.value
      }
    }
  }

  expirationSeconds = parseInt(expirationSeconds.toString() + '000')
  const invoiceDate = parseInt(
    decodedPaymentRequest.data.time_stamp.toString() + '000'
  )

  const amount = decodedPaymentRequest['human_readable_part']['amount']
  let msat = 0
  let sat = 0
  if (Number.isInteger(amount)) {
    msat = amount
    sat = amount / 1000
  }

  return { sat, msat, paymentHash, invoiceDate, expirationSeconds, memo }
}
