import * as lndService from "../grpc/subscribe";
import * as Lightning from "../grpc/lightning";
import { ACTIONS } from "../controllers";
import * as tribes from "../utils/tribes";
import * as signer from "../utils/signer";
import { models } from "../models";
import { sendMessage } from "./send";
import {
  modifyPayloadAndSaveMediaKey,
  purchaseFromOriginalSender,
  sendFinalMemeIfFirstPurchaser,
} from "./modify";
import { decryptMessage, encryptTribeBroadcast } from "../utils/msg";
import { Op } from "sequelize";
import * as timers from "../utils/timers";
import * as socket from "../utils/socket";
import { sendNotification } from "../hub";
import constants from "../constants";
import * as jsonUtils from "../utils/json";
import { isProxy } from "../utils/proxy";
import * as bolt11 from '@boltz/bolt11'
import {loadConfig} from '../utils/config'

const config = loadConfig()
/*
delete type:
owner needs to check that the delete is the one who made the msg
in receiveDeleteMessage check the deleter is og sender?
*/

const msgtypes = constants.message_types;

export const typesToForward = [
  msgtypes.message,
  msgtypes.group_join,
  msgtypes.group_leave,
  msgtypes.attachment,
  msgtypes.delete,
  msgtypes.boost,
];
export const typesToSkipIfSkipBroadcastJoins = [
  msgtypes.group_join,
  msgtypes.group_leave,
]
const typesToModify = [msgtypes.attachment];
const typesThatNeedPricePerMessage = [
  msgtypes.message,
  msgtypes.attachment,
  msgtypes.boost,
];
export const typesToReplay = [
  // should match typesToForward
  msgtypes.message,
  msgtypes.group_join,
  msgtypes.group_leave,
  msgtypes.bot_res,
  msgtypes.boost,
];
const botTypes = [
  constants.message_types.bot_install,
  constants.message_types.bot_cmd,
  constants.message_types.bot_res,
];
const botMakerTypes = [
  constants.message_types.bot_install,
  constants.message_types.bot_cmd,
];
async function onReceive(payload: { [k: string]: any }, dest: string) {
  if (dest) {
    if (typeof dest !== "string" || dest.length !== 66)
      return console.log("INVALID DEST", dest);
  }
  payload.dest = dest; // add "dest" into payload

  // console.log("===> onReceive", JSON.stringify(payload, null, 2));
  if (!(payload.type || payload.type === 0))
    return console.log("no payload.type");

  let owner = await models.Contact.findOne({
    where: { isOwner: true, publicKey: dest },
  });
  if (!owner) return console.log("=> RECEIVE: owner not found");
  const tenant: number = owner.id;

  const ownerDataValues = owner || owner.dataValues;

  if (botTypes.includes(payload.type)) {
    // if is admin on tribe? or is bot maker?
    console.log("=> got bot msg type!!!!");
    if (botMakerTypes.includes(payload.type)) {
      if (!payload.bot_uuid) return console.log("bot maker type: no bot uuid");
    }
    payload.owner = ownerDataValues;
    return ACTIONS[payload.type](payload);
  }
  // if tribe, owner must forward to MQTT
  let doAction = true;
  const toAddIn: { [k: string]: any } = {};
  let isTribe = false;
  let isTribeOwner = false;
  let chat;

  if (payload.chat && payload.chat.uuid) {
    isTribe = payload.chat.type === constants.chat_types.tribe;
    chat = await models.Chat.findOne({
      where: { uuid: payload.chat.uuid, tenant },
    });
    if (chat) chat.update({ seen: false });
  }
  if (isTribe) {
    const tribeOwnerPubKey = chat && chat.ownerPubkey;
    isTribeOwner = owner.publicKey === tribeOwnerPubKey;
  }
  if (isTribeOwner) toAddIn.isTribeOwner = true;
  if (isTribeOwner && typesToForward.includes(payload.type)) {
    const needsPricePerMessage = typesThatNeedPricePerMessage.includes(
      payload.type
    );
    // CHECK THEY ARE IN THE GROUP if message
    const senderContact = await models.Contact.findOne({
      where: { publicKey: payload.sender.pub_key, tenant },
    });
    // if (!senderContact) return console.log("=> no sender contact")
    const senderContactId = senderContact && senderContact.id;
    if (needsPricePerMessage && senderContactId) {
      const senderMember = await models.ChatMember.findOne({
        where: { contactId: senderContactId, chatId: chat.id, tenant },
      });
      if (!senderMember) doAction = false;
    }
    // CHECK PRICES
    if (needsPricePerMessage) {
      if (payload.message.amount < chat.pricePerMessage) {
        doAction = false;
      }
      if (chat.escrowAmount && senderContactId) {
        timers.addTimer({
          // pay them back
          amount: chat.escrowAmount,
          millis: chat.escrowMillis,
          receiver: senderContactId,
          msgId: payload.message.id,
          chatId: chat.id,
          tenant,
        });
      }
    }
    // check price to join AND private chat
    if (payload.type === msgtypes.group_join) {
      if (payload.message.amount < chat.priceToJoin) {
        doAction = false;
      }
      if (chat.private && senderContactId) {
        // check if has been approved
        const senderMember = await models.ChatMember.findOne({
          where: { contactId: senderContactId, chatId: chat.id, tenant },
        });
        if (
          !(
            senderMember &&
            senderMember.status === constants.chat_statuses.approved
          )
        ) {
          doAction = false; // dont let if private and not approved
        }
      }
    }
    // check that the sender is the og poster
    if (payload.type === msgtypes.delete && senderContactId) {
      doAction = false;
      if (payload.message.uuid) {
        const ogMsg = await models.Message.findOne({
          where: {
            uuid: payload.message.uuid,
            sender: senderContactId,
            tenant,
          },
        });
        if (ogMsg) doAction = true;
      }
    }
    // forward boost sats to recipient
    let realSatsContactId = null;
    let amtToForward = 0;
    if (payload.type === msgtypes.boost && payload.message.replyUuid) {
      const ogMsg = await models.Message.findOne({
        where: {
          uuid: payload.message.replyUuid,
          tenant,
        },
      });
      if (ogMsg && ogMsg.sender) {
        // even include "me"
        const theAmtToForward =
          payload.message.amount -
          (chat.pricePerMessage || 0) -
          (chat.escrowAmount || 0);
        if (theAmtToForward > 0) {
          realSatsContactId = ogMsg.sender;
          amtToForward = theAmtToForward;
          if (amtToForward && payload.message && payload.message.amount) {
            payload.message.amount = amtToForward; // mutate the payload amount
          }
        }
      }
    }
    // make sure alias is unique among chat members
    payload = await uniqueifyAlias(payload, senderContact, chat, owner);
    if (doAction)
      forwardMessageToTribe(
        payload,
        senderContact,
        realSatsContactId,
        amtToForward,
        owner
      );
    else console.log("=> insufficient payment for this action");
  }
  if (isTribeOwner && payload.type === msgtypes.purchase) {
    const mt = payload.message.mediaToken;
    const host = mt && mt.split(".").length && mt.split(".")[0];
    const muid = mt && mt.split(".").length && mt.split(".")[1];
    const myAttachmentMessage = await models.Message.findOne({
      where: {
        mediaToken: { [Op.like]: `${host}.${muid}%` },
        type: msgtypes.attachment,
        sender: tenant,
        tenant,
      },
    });
    if (!myAttachmentMessage) {
      // someone else's attachment
      const senderContact = await models.Contact.findOne({
        where: { publicKey: payload.sender.pub_key, tenant },
      });
      purchaseFromOriginalSender(payload, chat, senderContact, owner);
      doAction = false;
    }
  }
  if (isTribeOwner && payload.type === msgtypes.purchase_accept) {
    const purchaserID = payload.message && payload.message.purchaser;
    const iAmPurchaser = purchaserID && purchaserID === tenant;
    if (!iAmPurchaser) {
      const senderContact = await models.Contact.findOne({
        where: { publicKey: payload.sender.pub_key, tenant },
      });
      sendFinalMemeIfFirstPurchaser(payload, chat, senderContact, owner);
      doAction = false; // skip this! we dont need it
    }
  }
  if (doAction) doTheAction({ ...payload, ...toAddIn }, ownerDataValues);
}

async function doTheAction(data, owner) {
  // console.log("=> doTheAction", data, owner)
  let payload = data;
  if (payload.isTribeOwner) {
    // this is only for storing locally, my own messages as tribe owner
    // actual encryption for tribe happens in personalizeMessage
    const ogContent = data.message && data.message.content;
    // const ogMediaKey = data.message && data.message.mediaKey
    /* decrypt and re-encrypt with phone's pubkey for storage */
    const chat = await models.Chat.findOne({
      where: { uuid: payload.chat.uuid, tenant: owner.id },
    });
    const pld = await decryptMessage(data, chat);
    const me = owner;
    payload = await encryptTribeBroadcast(pld, me, true); // true=isTribeOwner
    if (ogContent)
      payload.message.remoteContent = JSON.stringify({ chat: ogContent }); // this is the key
    //if(ogMediaKey) payload.message.remoteMediaKey = JSON.stringify({'chat':ogMediaKey})
  }
  if (ACTIONS[payload.type]) {
    payload.owner = owner;
    // console.log("ACTIONS!", ACTIONS[payload.type])
    ACTIONS[payload.type](payload);
  } else {
    console.log("Incorrect payload type:", payload.type);
  }
}

async function uniqueifyAlias(payload, sender, chat, owner): Promise<Object> {
  if (!chat || !sender || !owner) return payload;
  if (!(payload && payload.sender)) return payload;
  const senderContactId = sender.id; // og msg sender

  const owner_alias = chat.myAlias || owner.alias;
  const sender_alias = payload.sender && payload.sender.alias;
  let final_sender_alias = sender_alias;
  const chatMembers = await models.ChatMember.findAll({
    where: { chatId: chat.id, tenant: owner.id },
  });
  if (!(chatMembers && chatMembers.length)) return payload;
  asyncForEach(chatMembers, (cm) => {
    if (cm.contactId === senderContactId) return; // dont check against self of course
    if (sender_alias === cm.lastAlias || sender_alias === owner_alias) {
      // impersonating! switch it up!
      final_sender_alias = `${sender_alias}_2`;
    }
  });
  if (sender_alias !== final_sender_alias) {
    await models.ChatMember.update(
      // this syntax is necessary when no unique ID on the Model
      { lastAlias: final_sender_alias },
      {
        where: {
          chatId: chat.id,
          contactId: senderContactId,
          tenant: owner.id,
        },
      }
    );
  }

  payload.sender.alias = final_sender_alias;
  return payload;
}

async function forwardMessageToTribe(
  ogpayload,
  sender,
  realSatsContactId,
  amtToForwardToRealSatsContactId,
  owner
) {
  // console.log('forwardMessageToTribe')
  const tenant = owner.id;
  const chat = await models.Chat.findOne({
    where: { uuid: ogpayload.chat.uuid, tenant },
  });
  if (!chat) return;

  if(chat.skipBroadcastJoins) {
    if(typesToSkipIfSkipBroadcastJoins.includes(ogpayload.type)){
      return
    }
  }

  let payload;
  if (sender && typesToModify.includes(ogpayload.type)) {
    payload = await modifyPayloadAndSaveMediaKey(
      ogpayload,
      chat,
      sender,
      owner
    );
  } else {
    payload = ogpayload;
  }

  const type = payload.type;
  const message = payload.message;
  sendMessage({
    type,
    message,
    sender: {
      ...owner.dataValues,
      alias: (payload.sender && payload.sender.alias) || "",
      photoUrl: (payload.sender && payload.sender.photo_url) || "",
      role: constants.chat_roles.reader,
    },
    amount: amtToForwardToRealSatsContactId || 0,
    chat: chat,
    skipPubKey: payload.sender.pub_key, // dont forward back to self
    realSatsContactId,
    success: () => {},
    receive: () => {},
    isForwarded: true,
  });
}

export async function initGrpcSubscriptions() {
  try {
    if(config.lightning_provider==='GREENLIGHT') {
      await Lightning.schedule(config.scheduler_default_pubkey)
    }
    const i = await Lightning.getInfo(true); // try proxy
    console.log('========', i)
    // const c = await Lightning.listChannels(); // examp
    // console.log('>>>>>>>>', c)
    // const inv = await Lightning.addInvoice({
    //   value: 1000,
    //   memo: 'hello world',
    // })
    // console.log("CREATED INVOICE", inv)
    await lndService.subscribeInvoices(parseKeysendInvoice);
  } catch (e) {
    console.log(e)
    throw e;
  }
}

export async function receiveMqttMessage(topic, message) {
  try {
    const msg = message.toString();
    // check topic is signed by sender?
    const payload = await parseAndVerifyPayload(msg);
    if (!payload) return; // skip it if not parsed
    payload.network_type = constants.network_types.mqtt;

    const arr = topic.split("/");
    const dest = arr[0];
    onReceive(payload, dest);
  } catch (e) {}
}

export async function initTribesSubscriptions() {
  tribes.connect(receiveMqttMessage);
}

function parsePayload(data) {
  const li = data.lastIndexOf("}");
  const msg = data.substring(0, li + 1);
  try {
    const payload = JSON.parse(msg);
    return payload || "";
  } catch (e) {
    throw e;
  }
}

// VERIFY PUBKEY OF SENDER from sig
async function parseAndVerifyPayload(data) {
  let payload;
  const li = data.lastIndexOf("}");
  const msg = data.substring(0, li + 1);
  const sig = data.substring(li + 1);
  try {
    payload = JSON.parse(msg);
    if (payload && payload.sender && payload.sender.pub_key) {
      let v;
      // console.log("=> SIG LEN", sig.length)
      if (sig.length === 96 && payload.sender.pub_key) {
        v = await signer.verifyAscii(msg, sig, payload.sender.pub_key);
      }
      if (sig.length === 104) {
        v = await Lightning.verifyAscii(msg, sig);
      }
      if (v && v.valid) {
        return payload;
      } else {
        return payload; // => RM THIS
      }
    } else {
      console.log("no sender.pub_key");
      return null;
    }
  } catch (e) {
    if (payload) return payload; // => RM THIS
    return null;
  }
}

async function saveAnonymousKeysend(inv, memo, sender_pubkey, tenant) {
  let sender = 0; // not required
  if (sender_pubkey) {
    const theSender = await models.Contact.findOne({
      where: { publicKey: sender_pubkey, tenant },
    });
    if (theSender && theSender.id) {
      sender = theSender.id;
    }
  }
  const amount = (inv.value && parseInt(inv.value)) || 0
  var date = new Date();
  date.setMilliseconds(0);
  const msg = await models.Message.create({
    chatId: 0,
    type: constants.message_types.keysend,
    sender,
    amount,
    amountMsat: amount * 1000,
    paymentHash: "",
    date: date,
    messageContent: memo || "",
    status: constants.statuses.confirmed,
    createdAt: date,
    updatedAt: date,
    network_type: constants.network_types.lightning,
    tenant,
  });
  socket.sendJson(
    {
      type: "keysend",
      response: jsonUtils.messageToJson(msg, null),
    },
    tenant
  );
}

export async function parseKeysendInvoice(i) {
  const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records;

  let dest = "";
  let owner;
  if (isProxy()) {
    try {
      const invoice = bolt11.decode(i.payment_request)
      if (!invoice.payeeNodeKey)
        return console.log("cant get dest from pay req");
      dest = invoice.payeeNodeKey;
      owner = await models.Contact.findOne({
        where: { isOwner: true, publicKey: dest },
      });
    } catch (e) {
      console.log("FAILURE TO DECODE PAY REQ", e);
    }
  } else {
    // non-proxy, only one "owner"
    owner = await models.Contact.findOne({ where: { isOwner: true } });
    dest = owner.publicKey;
  }
  if (!owner || !dest) {
    console.log("=> parseKeysendInvoice ERROR: cant find owner");
    return;
  }

  const buf = recs && recs[Lightning.SPHINX_CUSTOM_RECORD_KEY];
  const data = buf && buf.toString();
  const value = i && i.value && parseInt(i.value);

  // "keysend" type is NOT encrypted
  // and should be saved even if there is NO content
  let isKeysendType = false;
  let memo = "";
  let sender_pubkey;
  if (data) {
    try {
      const payload = parsePayload(data);
      if (payload && payload.type === constants.message_types.keysend) {
        isKeysendType = true;
        memo = payload.message && payload.message.content;
        sender_pubkey = payload.sender && payload.sender.pub_key;
      }
    } catch (e) {} // err could be a threaded TLV
  } else {
    isKeysendType = true;
  }
  if (isKeysendType) {
    if (!memo) {
      sendNotification(-1, "", "keysend", owner, value || 0);
    }
    saveAnonymousKeysend(i, memo, sender_pubkey, owner.id);
    return;
  }

  let payload;
  if (data[0] === "{") {
    try {
      payload = await parseAndVerifyPayload(data);
    } catch (e) {}
  } else {
    const threads = weave(data);
    if (threads) payload = await parseAndVerifyPayload(threads);
  }
  if (payload) {
    const dat = payload;
    if (value && dat && dat.message) {
      dat.message.amount = value; // ADD IN TRUE VALUE
    }
    dat.network_type = constants.network_types.lightning;
    onReceive(dat, dest);
  }
}

const chunks = {};
function weave(p) {
  const pa = p.split("_");
  if (pa.length < 4) return;
  const ts = pa[0];
  const i = pa[1];
  const n = pa[2];
  const m = pa.filter((u, i) => i > 2).join("_");
  chunks[ts] = chunks[ts] ? [...chunks[ts], { i, n, m }] : [{ i, n, m }];
  if (chunks[ts].length === parseInt(n)) {
    // got em all!
    const all = chunks[ts];
    let payload = "";
    all
      .slice()
      .sort((a, b) => a.i - b.i)
      .forEach((obj) => {
        payload += obj.m;
      });
    delete chunks[ts];
    return payload;
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
