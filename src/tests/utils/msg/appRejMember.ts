import * as http from 'ava-http'
import { makeArgs } from '../helpers'

export async function appRejMember(t, admin, contactID, msgId, status) {
  //NODE1 APPROVE OR REJECT NODE2 ===>

  //status === "approved" or "rejected"
  //contactID === member awaiting approval
  //msgId === join message id

  const appRej = await http.put(
    admin.external_ip + `/member/${contactID}/${status}/${msgId}`,
    makeArgs(admin)
  )
  t.truthy(appRej)
  // console.log("APPREJ === ", JSON.stringify(appRej))

  return true
}
