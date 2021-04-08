import * as moment from "moment";
import * as zbase32 from "./zbase32";
import * as LND from "./lightning";
import * as mqtt from "mqtt";
import { IClientSubscribeOptions } from "mqtt";
import fetch from "node-fetch";
import { models, sequelize } from "../models";
import { makeBotsJSON, declare_bot } from "./tribeBots";
import { loadConfig } from "./config";
import { isProxy } from "./proxy";
import { Op } from "sequelize";
import {logging} from './logger'
import { sleep } from "../helpers";

export { declare_bot };

const config = loadConfig();

// {pubkey: {host: Client} }
let clients: { [k: string]: { [k: string]: mqtt.Client } } = {};

const optz: IClientSubscribeOptions = { qos: 0 };

// this runs at relay startup
export async function connect(onMessage: Function) {
  initAndSubscribeTopics(onMessage);
}

export async function getTribeOwnersChatByUUID(uuid: string) {
  const isOwner = isProxy() ? "'t'" : "1";
  try {
    const r = await sequelize.query(
      `
      SELECT sphinx_chats.* FROM sphinx_chats
      INNER JOIN sphinx_contacts
      ON sphinx_chats.owner_pubkey = sphinx_contacts.public_key
      AND sphinx_contacts.is_owner = ${isOwner}
      AND sphinx_contacts.id = sphinx_chats.tenant
      AND sphinx_chats.uuid = '${uuid}'`,
      {
        model: models.Chat,
        mapToModel: true, // pass true here if you have any mapped fields
      }
    );
    // console.log("=> getTribeOWnersChatByUUID", r);
    // console.log('=> getTribeOwnersChatByUUID r:', r)
    return r && r[0] && r[0].dataValues;
  } catch (e) {
    console.log(e);
  }
}

async function initializeClient(pubkey, host, onMessage): Promise<mqtt.Client> {
  return new Promise(async (resolve, reject) => {
    let connected = false
    async function reconnect() {
      const pwd = await genSignedTimestamp(pubkey);
      if (connected) return
      const url = mqttURL(host);
      const cl = mqtt.connect(url, {
        username: pubkey,
        password: pwd,
        reconnectPeriod: 0, // dont auto reconnect
      });
      if(logging.Tribes) console.log("[tribes] try to connect:", url);
      cl.on("connect", async function () {
        if(logging.Tribes) console.log("[tribes] connected!");
        connected = true
        cl.on("close", function (e) {
          if(logging.Tribes) console.log("[tribes] CLOSE", e);
          // setTimeout(() => reconnect(), 2000);
          connected = false
        });
        cl.on("error", function (e) {
          if(logging.Tribes) console.log("[tribes] error: ", e.message || e);
        });
        cl.on("message", function (topic, message) {
          // console.log("============>>>>> GOT A MSG", topic, message)
          if (onMessage) onMessage(topic, message);
        });
        cl.subscribe(`${pubkey}/#`, function (err) {
          if (err) console.log("[tribes] error subscribing", err);
          else {
            if(logging.Tribes) console.log("[tribes] subscribed!", `${pubkey}/#`);
            resolve(cl);
          }
        });
      });
    }
    while (true) {
      if(!connected) {
        reconnect();
      }
      await sleep(5000 + Math.round(Math.random()*8000))
    }
  });
}

async function lazyClient(
  pubkey: string,
  host: string,
  onMessage?: Function
): Promise<mqtt.Client> {
  if (clients[pubkey] && clients[pubkey][host]) {
    return clients[pubkey][host];
  }
  const cl = await initializeClient(pubkey, host, onMessage);
  if (!clients[pubkey]) clients[pubkey] = {};
  clients[pubkey][host] = cl; // ADD TO MAIN STATE
  return cl;
}

async function initAndSubscribeTopics(onMessage: Function) {
  const host = getHost();
  try {
    if (isProxy()) {
      const allOwners = await models.Contact.findAll({
        where: { isOwner: true },
      });
      if (!(allOwners && allOwners.length)) return;
      asyncForEach(allOwners, async (c) => {
        if (c.id === 1) return; // the proxy non user
        if (c.publicKey && c.publicKey.length === 66) {
          await lazyClient(c.publicKey, host, onMessage);
          await subExtraHostsForTenant(c.id, c.publicKey, onMessage); // 1 is the tenant id on non-proxy
        }
      });
    } else {
      // just me
      const info = await LND.getInfo(false);
      await lazyClient(info.identity_pubkey, host, onMessage);
      updateTribeStats(info.identity_pubkey);
      subExtraHostsForTenant(1, info.identity_pubkey, onMessage); // 1 is the tenant id on non-proxy
    }
  } catch (e) {
    console.log("TRIBES ERROR", e);
  }
}

async function subExtraHostsForTenant(
  tenant: number,
  pubkey: string,
  onMessage: Function
) {
  const host = getHost();
  const externalTribes = await models.Chat.findAll({
    where: {
      tenant,
      host: { [Op.ne]: host }, // not the host from config
    },
  });
  if (!(externalTribes && externalTribes.length)) return;
  const usedHosts: string[] = [];
  externalTribes.forEach(async (et) => {
    if (usedHosts.includes(et.host)) return;
    usedHosts.push(et.host); // dont do it twice
    const client = await lazyClient(pubkey, host, onMessage);
    client.subscribe(`${pubkey}/#`, optz, function (err) {
      if (err) console.log("[tribes] subscribe error 2", err);
    });
  });
}

export function printTribesClients() {
  const ret = {};
  Object.entries(clients).forEach((entry) => {
    const pk = entry[0];
    const obj = entry[1];
    ret[pk] = {};
    Object.keys(obj).forEach((host) => {
      ret[pk][host] = true;
    });
  });
  return JSON.stringify(ret);
}

export async function addExtraHost(
  pubkey: string,
  host: string,
  onMessage: Function
) {
  // console.log("ADD EXTRA HOST", printTribesClients(), host);
  if (getHost() === host) return; // not for default host
  if (clients[pubkey] && clients[pubkey][host]) return; // already exists
  const client = await lazyClient(pubkey, host, onMessage);
  client.subscribe(`${pubkey}/#`, optz);
}

// if host includes colon, remove it
function mqttURL(host) {
  if (host.includes(":")) {
    const arr = host.split(":");
    host = arr[0];
  }
  let port = "8883";
  let protocol = "tls";
  if (config.tribes_mqtt_port) {
    port = config.tribes_mqtt_port;
  }
  if (config.tribes_insecure) {
    protocol = "tcp";
  }
  return `${protocol}://${host}:${port}`;
}

// for proxy, need to get all isOwner contacts and their owned chats
async function updateTribeStats(myPubkey) {
  if (isProxy()) return; // skip on proxy for now?
  const myTribes = await models.Chat.findAll({
    where: {
      ownerPubkey: myPubkey,
      deleted: false,
    },
  });
  await asyncForEach(myTribes, async (tribe) => {
    try {
      const contactIds = JSON.parse(tribe.contactIds);
      const member_count = (contactIds && contactIds.length) || 0;
      await putstats({
        uuid: tribe.uuid,
        host: tribe.host,
        member_count,
        chatId: tribe.id,
        owner_pubkey: myPubkey,
      });
    } catch (e) {}
  });
  if (myTribes.length) {
    if(logging.Tribes) console.log(`[tribes] updated stats for ${myTribes.length} tribes`);
  }
}

export async function subscribe(topic, onMessage: Function) {
  const pubkey = topic.split("/")[0];
  if (pubkey.length !== 66) return;
  const host = getHost();
  const client = await lazyClient(pubkey, host, onMessage);
  if (client)
    client.subscribe(topic, function () {
      if(logging.Tribes) console.log("[tribes] added sub", host, topic);
    });
}

export async function publish(topic, msg, ownerPubkey, cb) {
  if (ownerPubkey.length !== 66) return;
  const host = getHost();
  const client = await lazyClient(ownerPubkey, host);
  if (client)
    client.publish(topic, msg, optz, function (err) {
      if (err) console.log("[tribes] error publishing", err);
      else if (cb) cb();
    });
}

export async function declare({
  uuid,
  name,
  description,
  tags,
  img,
  group_key,
  host,
  price_per_message,
  price_to_join,
  owner_alias,
  owner_pubkey,
  escrow_amount,
  escrow_millis,
  unlisted,
  is_private,
  app_url,
  feed_url,
  owner_route_hint,
}) {
  try {
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    await fetch(protocol + "://" + host + "/tribes", {
      method: "POST",
      body: JSON.stringify({
        uuid,
        group_key,
        name,
        description,
        tags,
        img: img || "",
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        owner_alias,
        owner_pubkey,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        unlisted: unlisted || false,
        private: is_private || false,
        app_url: app_url || "",
        feed_url: feed_url || "",
        owner_route_hint: owner_route_hint || "",
      }),
      headers: { "Content-Type": "application/json" },
    });
    // const j = await r.json()
  } catch (e) {
    console.log("[tribes] unauthorized to declare");
    throw e;
  }
}

export async function edit({
  uuid,
  host,
  name,
  description,
  tags,
  img,
  price_per_message,
  price_to_join,
  owner_alias,
  escrow_amount,
  escrow_millis,
  unlisted,
  is_private,
  app_url,
  feed_url,
  deleted,
  owner_route_hint,
  owner_pubkey,
}) {
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    await fetch(protocol + "://" + host + "/tribe?token=" + token, {
      method: "PUT",
      body: JSON.stringify({
        uuid,
        name,
        description,
        tags,
        img: img || "",
        price_per_message: price_per_message || 0,
        price_to_join: price_to_join || 0,
        escrow_amount: escrow_amount || 0,
        escrow_millis: escrow_millis || 0,
        owner_alias,
        unlisted: unlisted || false,
        private: is_private || false,
        deleted: deleted || false,
        app_url: app_url || "",
        feed_url: feed_url || "",
        owner_route_hint: owner_route_hint || "",
      }),
      headers: { "Content-Type": "application/json" },
    });
    // const j = await r.json()
  } catch (e) {
    console.log("[tribes] unauthorized to edit");
    throw e;
  }
}

export async function delete_tribe(uuid, owner_pubkey) {
  const host = getHost();
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    await fetch(`${protocol}://${host}/tribe/${uuid}?token=${token}`, {
      method: "DELETE",
    });
    // const j = await r.json()
  } catch (e) {
    console.log("[tribes] unauthorized to delete");
    throw e;
  }
}

export async function putActivity(
  uuid: string,
  host: string,
  owner_pubkey: string
) {
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    await fetch(`${protocol}://${host}/tribeactivity/${uuid}?token=` + token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("[tribes] unauthorized to putActivity");
    throw e;
  }
}

export async function putstats({
  uuid,
  host,
  member_count,
  chatId,
  owner_pubkey,
}) {
  if (!uuid) return;
  const bots = await makeBotsJSON(chatId);
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    await fetch(protocol + "://" + host + "/tribestats?token=" + token, {
      method: "PUT",
      body: JSON.stringify({
        uuid,
        member_count,
        bots: JSON.stringify(bots || []),
      }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("[tribes] unauthorized to putstats");
    throw e;
  }
}

export async function genSignedTimestamp(ownerPubkey: string) {
  // console.log('genSignedTimestamp')
  const now = moment().unix();
  const tsBytes = Buffer.from(now.toString(16), "hex");
  const sig = await LND.signBuffer(tsBytes, ownerPubkey);
  const sigBytes = zbase32.decode(sig);
  const totalLength = tsBytes.length + sigBytes.length;
  const buf = Buffer.concat([tsBytes, sigBytes], totalLength);
  return urlBase64(buf);
}

export async function verifySignedTimestamp(stsBase64) {
  const stsBuf = Buffer.from(stsBase64, "base64");
  const sig = stsBuf.subarray(4, 92);
  const sigZbase32 = zbase32.encode(sig);
  const r = await LND.verifyBytes(stsBuf.subarray(0, 4), sigZbase32); // sig needs to be zbase32 :(
  if (r.valid) {
    return r.pubkey;
  } else {
    return false;
  }
}

export function getHost() {
  return config.tribes_host || "";
}

function urlBase64(buf) {
  return buf.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

