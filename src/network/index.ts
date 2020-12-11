import { sendMessage, signAndSend, newmsg } from './send'
import {
    initGrpcSubscriptions, initTribesSubscriptions, parseKeysendInvoice,
    typesToReplay, typesToForward,
} from './receive'
import { Msg } from './interfaces'

/*
Abstracts between lightning network and MQTT depending on Chat type and sender
*/

export {
    sendMessage, signAndSend, newmsg,
    initGrpcSubscriptions,
    initTribesSubscriptions,
    parseKeysendInvoice,
    typesToReplay, typesToForward,
    Msg,
}

