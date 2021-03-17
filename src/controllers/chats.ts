import { models } from "../models";
import * as jsonUtils from "../utils/json";
import { success, failure } from "../utils/res";
import * as helpers from "../helpers";
import * as network from "../network";
import * as socket from "../utils/socket";
import { sendNotification } from "../hub";
import * as md5 from "md5";
import * as tribes from "../utils/tribes";
import * as timers from "../utils/timers";
import {
  replayChatHistory,
  createTribeChatParams,
  addPendingContactIdsToChat,
} from "./chatTribes";
import constants from "../constants";

export async function updateChat(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;
  console.log("=> updateChat");
  const id = parseInt(req.params.id);
  if (!id) {
    return failure(res, "missing id");
  }
  const chat = await models.Chat.findOne({ where: { id, tenant } });
  if (!chat) {
    return failure(res, "chat not found");
  }
  const { name, photo_url, meta, my_alias, my_photo_url } = req.body;

  const obj: { [k: string]: any } = {};
  if (name) obj.name = name;
  if (photo_url) obj.photoUrl = photo_url;
  if (meta && typeof meta === "string") obj.meta = meta;
  if (my_alias) obj.myAlias = my_alias;
  if (my_photo_url || my_photo_url === "") obj.myPhotoUrl = my_photo_url;

  if (Object.keys(obj).length > 0) {
    await chat.update(obj);
  }
  success(res, jsonUtils.chatToJson(chat));
}

export async function kickChatMember(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;

  const chatId = parseInt(req.params["chat_id"]);
  const contactId = parseInt(req.params["contact_id"]);
  if (!chatId || !contactId) {
    return failure(res, "missing param");
  }
  // remove chat.contactIds
  let chat = await models.Chat.findOne({ where: { id: chatId, tenant } });
  const contactIds = JSON.parse(chat.contactIds || "[]");
  const newContactIds = contactIds.filter((cid) => cid !== contactId);
  await chat.update({ contactIds: JSON.stringify(newContactIds) });
  // remove from ChatMembers
  await models.ChatMember.destroy({
    where: {
      chatId,
      contactId,
      tenant,
    },
  });

  const owner = req.owner;
  network.sendMessage({
    chat: { ...chat.dataValues, contactIds: [contactId] }, // send only to the guy u kicked
    sender: owner,
    message: {},
    type: constants.message_types.group_kick,
  });

  // delete all timers for this member
  timers.removeTimersByContactIdChatId(contactId, chatId, tenant);

  success(res, jsonUtils.chatToJson(chat));
}

export async function receiveGroupKick(payload) {
  console.log("=> receiveGroupKick");
  const {
    owner,
    chat,
    sender,
    date_string,
    network_type,
  } = await helpers.parseReceiveParams(payload);
  if (!chat) return;
  const tenant: number = owner.id;

  // const owner = await models.Contact.findOne({where:{isOwner:true}})
  // await chat.update({
  // 	deleted: true,
  // 	uuid:'',
  // 	groupKey:'',
  // 	host:'',
  // 	photoUrl:'',
  // 	contactIds:'[]',
  // 	name:''
  // })
  // await models.Message.destroy({ where: { chatId: chat.id } })

  var date = new Date();
  date.setMilliseconds(0);
  if (date_string) date = new Date(date_string);
  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.group_kick,
    sender: (sender && sender.id) || 0,
    messageContent: "",
    remoteMessageContent: "",
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  };
  const message = await models.Message.create(msg);

  socket.sendJson(
    {
      type: "group_kick",
      response: {
        contact: jsonUtils.contactToJson(sender),
        chat: jsonUtils.chatToJson(chat),
        message: jsonUtils.messageToJson(message, null),
      },
    },
    tenant
  );
}

export async function getChats(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;
  const chats = await models.Chat.findAll({
    where: { deleted: false, tenant },
    raw: true,
  });
  const c = chats.map((chat) => jsonUtils.chatToJson(chat));
  success(res, c);
}

export async function mute(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;

  const chatId = req.params["chat_id"];
  const mute = req.params["mute_unmute"];

  if (!["mute", "unmute"].includes(mute)) {
    return failure(res, "invalid option for mute");
  }

  const chat = await models.Chat.findOne({ where: { id: chatId, tenant } });

  if (!chat) {
    return failure(res, "chat not found");
  }

  chat.update({ isMuted: mute == "mute" });

  success(res, jsonUtils.chatToJson(chat));
}

// just add self here if tribes
// or can u add contacts as members?
export async function createGroupChat(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;

  const {
    name,
    is_tribe,
    price_per_message,
    price_to_join,
    escrow_amount,
    escrow_millis,
    img,
    description,
    tags,
    unlisted,
    app_url,
    feed_url,
  } = req.body;
  const contact_ids = req.body.contact_ids || [];

  const members: { [k: string]: { [k: string]: string | number } } = {}; //{pubkey:{key,alias}, ...}
  const owner = req.owner;

  members[owner.publicKey] = {
    key: owner.contactKey,
    alias: owner.alias,
  };
  await asyncForEach(contact_ids, async (cid) => {
    const contact = await models.Contact.findOne({
      where: { id: cid, tenant },
    });
    members[contact.publicKey] = {
      key: contact.contactKey,
      alias: contact.alias || "",
    };
  });

  let chatParams: any = null;
  let okToCreate = true;
  if (is_tribe) {
    chatParams = await createTribeChatParams(
      owner,
      contact_ids,
      name,
      img,
      price_per_message,
      price_to_join,
      escrow_amount,
      escrow_millis,
      unlisted,
      req.body.private,
      app_url,
      feed_url,
      tenant
    );
    if (chatParams.uuid) {
      // publish to tribe server
      try {
        await tribes.declare({
          uuid: chatParams.uuid,
          name: chatParams.name,
          host: chatParams.host,
          group_key: chatParams.groupKey,
          price_per_message: price_per_message || 0,
          price_to_join: price_to_join || 0,
          escrow_amount: escrow_amount || 0,
          escrow_millis: escrow_millis || 0,
          description,
          tags,
          img,
          owner_pubkey: owner.publicKey,
          owner_alias: owner.alias,
          unlisted: unlisted || false,
          is_private: req.body.private || false,
          app_url,
          feed_url,
          owner_route_hint: owner.routeHint || "",
        });
      } catch (e) {
        console.log("=> couldnt create tribe", e);
        okToCreate = false;
      }
    }
    // make me owner when i create
    members[owner.publicKey].role = constants.chat_roles.owner;
  } else {
    chatParams = createGroupChatParams(owner, contact_ids, members, name);
  }

  if (!okToCreate) {
    return failure(res, "could not create tribe");
  }

  network.sendMessage({
    chat: { ...chatParams, members },
    sender: owner,
    type: constants.message_types.group_create,
    message: {},
    failure: function (e) {
      failure(res, e);
    },
    success: async function () {
      const chat = await models.Chat.create(chatParams);
      if (chat.type === constants.chat_types.tribe) {
        // save me as owner when i create
        try {
          await models.ChatMember.create({
            contactId: owner.id,
            chatId: chat.id,
            role: constants.chat_roles.owner,
            status: constants.chat_statuses.approved,
            tenant,
          });
        } catch (e) {
          console.log("=> createGroupChat failed to UPSERT", e);
        }
      }
      success(res, jsonUtils.chatToJson(chat));
    },
  });
}

// only owner can do for tribe?
export async function addGroupMembers(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;

  const { contact_ids } = req.body;
  const { id } = req.params;

  const members: { [k: string]: { [k: string]: string } } = {}; //{pubkey:{key,alias}, ...}
  const owner = req.owner;
  let chat = await models.Chat.findOne({ where: { id, tenant } });

  const contactIds = JSON.parse(chat.contactIds || "[]");
  // for all members (existing and new)
  members[owner.publicKey] = { key: owner.contactKey, alias: owner.alias };
  if (chat.type === constants.chat_types.tribe) {
    const me = await models.ChatMember.findOne({
      where: { contactId: owner.id, chatId: chat.id, tenant },
    });
    if (me) members[owner.publicKey].role = me.role;
  }
  const allContactIds = contactIds.concat(contact_ids);
  await asyncForEach(allContactIds, async (cid) => {
    const contact = await models.Contact.findOne({
      where: { id: cid, tenant },
    });
    if (contact) {
      members[contact.publicKey] = {
        key: contact.contactKey,
        alias: contact.alias,
      };
      const member = await models.ChatMember.findOne({
        where: { contactId: owner.id, chatId: chat.id, tenant },
      });
      if (member) members[contact.publicKey].role = member.role;
    }
  });

  success(res, jsonUtils.chatToJson(chat));

  network.sendMessage({
    // send ONLY to new members
    chat: { ...chat.dataValues, contactIds: contact_ids, members },
    sender: owner,
    type: constants.message_types.group_invite,
    message: {},
  });
}

export const deleteChat = async (req, res) => {
  if (!req.owner) return failure(res, "no owner");
  const tenant: number = req.owner.id;

  const { id } = req.params;

  const owner = req.owner;
  const chat = await models.Chat.findOne({ where: { id, tenant } });
  if (!chat) {
    return failure(res, "you are not in this group");
  }

  const tribeOwnerPubKey = chat.ownerPubkey;
  if (owner.publicKey === tribeOwnerPubKey) {
    // delete a group or tribe
    let notOK = false;
    await network.sendMessage({
      chat,
      sender: owner,
      message: {},
      type: constants.message_types.tribe_delete,
      success: function () {
        tribes.delete_tribe(chat.uuid, owner.publicKey);
      },
      failure: function () {
        failure(res, "failed to send tribe_delete message");
        notOK = true;
      },
    });
    if (notOK) return console.log("failed to send tribe_delete message");
  } else {
    // leave a group or tribe
    const isPending = chat.status === constants.chat_statuses.pending;
    const isRejected = chat.status === constants.chat_statuses.rejected;
    if (!isPending && !isRejected) {
      // dont send if pending
      network.sendMessage({
        chat,
        sender: owner,
        message: {},
        type: constants.message_types.group_leave,
      });
    }
  }

  await chat.update({
    deleted: true,
    uuid: "",
    groupKey: "",
    host: "",
    photoUrl: "",
    contactIds: "[]",
    name: "",
  });
  await models.Message.destroy({ where: { chatId: id, tenant } });
  await models.ChatMember.destroy({ where: { chatId: id, tenant } });

  success(res, { chat_id: id });
};

export async function receiveGroupJoin(payload) {
  console.log("=> receiveGroupJoin");
  const {
    owner,
    chat,
    sender_pub_key,
    sender_alias,
    chat_members,
    chat_type,
    isTribeOwner,
    date_string,
    network_type,
    sender_photo_url,
    sender_route_hint,
  } = await helpers.parseReceiveParams(payload);
  const tenant: number = owner.id;

  if (!chat) return;

  const isTribe = chat_type === constants.chat_types.tribe;

  var date = new Date();
  date.setMilliseconds(0);
  if (date_string) date = new Date(date_string);

  let theSender: any = null;
  const member = chat_members[sender_pub_key];
  const senderAlias = (member && member.alias) || sender_alias || "Unknown";

  if (!isTribe || isTribeOwner) {
    const sender = await models.Contact.findOne({
      where: { publicKey: sender_pub_key, tenant },
    });
    const contactIds = JSON.parse(chat.contactIds || "[]");
    if (sender) {
      theSender = sender; // might already include??
      if (!contactIds.includes(sender.id)) contactIds.push(sender.id);
      // update sender contacT_key in case they reset?
      if (member && member.key) {
        if (sender.contactKey !== member.key) {
          await sender.update({ contactKey: member.key });
        }
      }
    } else {
      if (member && member.key) {
        const createdContact = await models.Contact.create({
          publicKey: sender_pub_key,
          contactKey: member.key,
          alias: senderAlias,
          status: 1,
          fromGroup: true,
          photoUrl: sender_photo_url,
          tenant,
          routeHint: sender_route_hint || "",
        });
        theSender = createdContact;
        contactIds.push(createdContact.id);
      }
    }
    if (!theSender) return console.log("no sender"); // fail (no contact key?)

    await chat.update({ contactIds: JSON.stringify(contactIds) });

    if (isTribeOwner) {
      // IF TRIBE, ADD new member TO XREF
      console.log("UPSERT CHAT MEMBER", {
        contactId: theSender.id,
        chatId: chat.id,
        role: constants.chat_roles.reader,
        status: constants.chat_statuses.pending,
        lastActive: date,
        lastAlias: senderAlias,
        tenant,
      });
      try {
        await models.ChatMember.upsert({
          contactId: theSender.id,
          chatId: chat.id,
          role: constants.chat_roles.reader,
          lastActive: date,
          status: constants.chat_statuses.approved,
          lastAlias: senderAlias,
          tenant,
        });
      } catch (e) {
        console.log("=> groupJoin could not upsert ChatMember");
      }
      setTimeout(() => {
        replayChatHistory(chat, theSender, owner);
      }, 2000);
      tribes.putstats({
        chatId: chat.id,
        uuid: chat.uuid,
        host: chat.host,
        member_count: contactIds.length,
        owner_pubkey: owner.publicKey,
      });
    }
  }

  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.group_join,
    sender: (theSender && theSender.id) || 0,
    messageContent: "",
    remoteMessageContent: "",
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  };
  if (isTribe) {
    msg.senderAlias = sender_alias;
    msg.senderPic = sender_photo_url;
  }
  const message = await models.Message.create(msg);

  const theChat = await addPendingContactIdsToChat(chat, tenant);
  socket.sendJson(
    {
      type: "group_join",
      response: {
        contact: jsonUtils.contactToJson(theSender || {}),
        chat: jsonUtils.chatToJson(theChat),
        message: jsonUtils.messageToJson(message, null),
      },
    },
    tenant
  );
}

export async function receiveGroupLeave(payload) {
  console.log("=> receiveGroupLeave");
  const {
    chat,
    owner,
    sender_pub_key,
    chat_type,
    sender_alias,
    isTribeOwner,
    date_string,
    network_type,
    sender_photo_url,
  } = await helpers.parseReceiveParams(payload);
  const tenant: number = owner.id;
  if (!chat) return;

  const isTribe = chat_type === constants.chat_types.tribe;

  let sender;
  // EITHER private chat OR tribeOwner
  if (!isTribe || isTribeOwner) {
    sender = await models.Contact.findOne({
      where: { publicKey: sender_pub_key, tenant },
    });
    if (!sender) return console.log("=> receiveGroupLeave cant find sender");

    const oldContactIds = JSON.parse(chat.contactIds || "[]");
    const contactIds = oldContactIds.filter((cid) => cid !== sender.id);
    await chat.update({ contactIds: JSON.stringify(contactIds) });

    if (isTribeOwner) {
      if (chat_type === constants.chat_types.tribe) {
        try {
          await models.ChatMember.destroy({
            where: { chatId: chat.id, contactId: sender.id, tenant },
          });
        } catch (e) {}
        tribes.putstats({
          chatId: chat.id,
          uuid: chat.uuid,
          host: chat.host,
          member_count: contactIds.length,
          owner_pubkey: owner.publicKey,
        });
      }
    }
  }

  var date = new Date();
  date.setMilliseconds(0);
  if (date_string) date = new Date(date_string);
  const msg: { [k: string]: any } = {
    chatId: chat.id,
    type: constants.message_types.group_leave,
    sender: (sender && sender.id) || 0,
    messageContent: "",
    remoteMessageContent: "",
    status: constants.statuses.confirmed,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  };
  if (isTribe) {
    msg.senderAlias = sender_alias;
    msg.senderPic = sender_photo_url;
  }
  const message = await models.Message.create(msg);

  socket.sendJson(
    {
      type: "group_leave",
      response: {
        contact: jsonUtils.contactToJson(sender),
        chat: jsonUtils.chatToJson(chat),
        message: jsonUtils.messageToJson(message, null),
      },
    },
    tenant
  );
}

async function validateTribeOwner(chat_uuid: string, pubkey: string) {
  const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(chat_uuid);
  if (verifiedOwnerPubkey === pubkey) {
    return true;
  }
  return false;
}
export async function receiveGroupCreateOrInvite(payload) {
  const {
    owner,
    sender_pub_key,
    chat_members,
    chat_name,
    chat_uuid,
    chat_type,
    chat_host,
    chat_key,
  } = await helpers.parseReceiveParams(payload);
  const tenant: number = owner.id;
  // maybe this just needs to move to adding tribe owner ChatMember?
  const isTribe = chat_type === constants.chat_types.tribe;
  if (isTribe) {
    // must be sent by tribe owner?????
    const validOwner = await validateTribeOwner(chat_uuid, sender_pub_key);
    if (!validOwner) return console.log("[tribes] invalid uuid signature!");
  }

  const contacts: any[] = [];
  const newContacts: any[] = [];
  for (let [pubkey, member] of Object.entries(chat_members)) {
    const contact = await models.Contact.findOne({
      where: { publicKey: pubkey, tenant },
    });
    let addContact = false;
    if (chat_type === constants.chat_types.group && member && member.key) {
      addContact = true;
    } else if (isTribe && member && member.role) {
      if (
        member.role === constants.chat_roles.owner ||
        member.role === constants.chat_roles.admin ||
        member.role === constants.chat_roles.mod
      ) {
        addContact = true;
      }
    }
    if (addContact) {
      if (!contact) {
        const createdContact = await models.Contact.create({
          publicKey: pubkey,
          contactKey: member.key,
          alias: member.alias || "Unknown",
          status: 1,
          fromGroup: true,
          tenant,
        });
        contacts.push({ ...createdContact.dataValues, role: member.role });
        newContacts.push(createdContact.dataValues);
      } else {
        contacts.push({ ...contact.dataValues, role: member.role });
      }
    }
  }

  const contactIds = contacts.map((c) => c.id);
  if (!contactIds.includes(owner.id)) contactIds.push(owner.id);
  // make chat
  let date = new Date();
  date.setMilliseconds(0);
  const chat = await models.Chat.create({
    uuid: chat_uuid,
    contactIds: JSON.stringify(contactIds),
    createdAt: date,
    updatedAt: date,
    name: chat_name,
    type: chat_type || constants.chat_types.group,
    ...(chat_host && { host: chat_host }),
    ...(chat_key && { groupKey: chat_key }),
    tenant,
  });

  if (isTribe) {
    // IF TRIBE, ADD TO XREF
    contacts.forEach((c) => {
      models.ChatMember.create({
        contactId: c.id,
        chatId: chat.id,
        role: c.role || constants.chat_roles.reader,
        lastActive: date,
        status: constants.chat_statuses.approved,
      });
    });
  }

  socket.sendJson(
    {
      type: "group_create",
      response: jsonUtils.messageToJson({ newContacts }, chat),
    },
    tenant
  );

  sendNotification(chat, chat_name, "group", owner);

  if (payload.type === constants.message_types.group_invite) {
    network.sendMessage({
      chat: {
        ...chat.dataValues,
        members: {
          [owner.publicKey]: {
            key: owner.contactKey,
            alias: owner.alias || "",
          },
        },
      },
      sender: owner,
      message: {},
      type: constants.message_types.group_join,
    });
  }
}

function createGroupChatParams(owner, contactIds, members, name) {
  let date = new Date();
  date.setMilliseconds(0);
  if (!(owner && members && contactIds && Array.isArray(contactIds))) {
    return;
  }

  const pubkeys: string[] = [];
  for (let pubkey of Object.keys(members)) {
    // just the key
    pubkeys.push(String(pubkey));
  }
  if (!(pubkeys && pubkeys.length)) return;

  const allkeys = pubkeys.includes(owner.publicKey)
    ? pubkeys
    : [owner.publicKey].concat(pubkeys);
  const hash = md5(allkeys.sort().join("-"));
  const theContactIds = contactIds.includes(owner.id)
    ? contactIds
    : [owner.id].concat(contactIds);
  return {
    uuid: `${new Date().valueOf()}-${hash}`,
    contactIds: JSON.stringify(theContactIds),
    createdAt: date,
    updatedAt: date,
    name: name,
    type: constants.chat_types.group,
  };
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
