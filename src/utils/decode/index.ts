import * as decodeUtils from "./decode";

export function decodePaymentRequest(paymentRequest) {
  var decodedPaymentRequest: any = decodeUtils.decode(paymentRequest);
  var expirationSeconds = 3600;
  var paymentHash = "";
  var memo = "";

  for (var i = 0; i < decodedPaymentRequest.data.tags.length; i++) {
    let tag = decodedPaymentRequest.data.tags[i];
    if (tag) {
      if (tag.description == "payment_hash") {
        paymentHash = tag.value;
      } else if (tag.description == "description") {
        memo = tag.value;
      } else if (tag.description == "expiry") {
        expirationSeconds = tag.value;
      }
    }
  }

  expirationSeconds = parseInt(expirationSeconds.toString() + "000");
  let invoiceDate = parseInt(
    decodedPaymentRequest.data.time_stamp.toString() + "000"
  );

  let amount = decodedPaymentRequest["human_readable_part"]["amount"];
  var msat = 0;
  var sat = 0;
  if (Number.isInteger(amount)) {
    msat = amount;
    sat = amount / 1000;
  }

  return { sat, msat, paymentHash, invoiceDate, expirationSeconds, memo };
}
