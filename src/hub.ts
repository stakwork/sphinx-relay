import { models, Contact } from "./models";
import fetch from "node-fetch";
import { Op } from "sequelize";
import * as socket from "./utils/socket";
import * as jsonUtils from "./utils/json";
import * as helpers from "./helpers";
import { nodeinfo, proxynodeinfo } from "./utils/nodeinfo";
import * as LND from "./utils/lightning";
import constants from "./constants";
import { loadConfig } from "./utils/config";
import * as https from "https";
import { isProxy } from "./utils/proxy";
import {sendNotification, resetNotifyTribeCount} from './notify'

const pingAgent = new https.Agent({
  keepAlive: true,
});
const checkInvitesAgent = new https.Agent({
  keepAlive: true,
});

const env = process.env.NODE_ENV || "development";
const config = loadConfig();

const checkInviteHub = async (params = {}) => {
  if (env != "production") {
    return;
  }
  //console.log('[hub] checking invites ping')

  const inviteStrings = await models.Invite.findAll({
    where: {
      status: {
        [Op.notIn]: [
          constants.invite_statuses.complete,
          constants.invite_statuses.expired,
        ],
      },
    },
  }).map((invite) => invite.inviteString);
  if (inviteStrings.length === 0) {
    return; // skip if no invites
  }

  fetch(config.hub_api_url + "/invites/check", {
    agent: checkInvitesAgent,
    method: "POST",
    body: JSON.stringify({ invite_strings: inviteStrings }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        json.object.invites.map(async (object) => {
          const invite = object.invite;
          const pubkey = object.pubkey;
          const routeHint = object.route_hint;
          const price = object.price;

          const dbInvite = await models.Invite.findOne({
            where: { inviteString: invite.pin },
          });
          const contact = await models.Contact.findOne({
            where: { id: dbInvite.contactId },
          });
          const owner = await models.Contact.findOne({
            where: { id: dbInvite.tenant },
          });

          if (dbInvite.status != invite.invite_status) {
            const updateObj: { [k: string]: any } = {
              status: invite.invite_status,
              price: price,
            };
            if (invite.invoice) updateObj.invoice = invite.invoice;

            dbInvite.update(updateObj);

            socket.sendJson(
              {
                type: "invite",
                response: jsonUtils.inviteToJson(dbInvite),
              },
              owner.id
            );

            if (dbInvite.status == constants.invite_statuses.ready && contact) {
              sendNotification(-1, contact.alias, "invite", owner);
            }
          }

          if (
            pubkey &&
            dbInvite.status == constants.invite_statuses.complete &&
            contact
          ) {
            const updateObj: { [k: string]: any } = {
              publicKey: pubkey,
              status: constants.contact_statuses.confirmed,
            };
            if (routeHint) updateObj.routeHint = routeHint;
            contact.update(updateObj);

            var contactJson = jsonUtils.contactToJson(contact);
            contactJson.invite = jsonUtils.inviteToJson(dbInvite);

            socket.sendJson(
              {
                type: "contact",
                response: contactJson,
              },
              owner.id
            );

            helpers.sendContactKeys({
              contactIds: [contact.id],
              sender: owner,
              type: constants.message_types.contact_key,
            });
          }
        });
      }
    })
    .catch((error) => {
      console.log("[hub error]", error);
    });
};

const pingHub = async (params = {}) => {
  if (env != "production" || config.dont_ping_hub==='true') {
    return;
  }

  const node = await nodeinfo();
  sendHubCall({ ...params, node });

  if (isProxy()) {
    // send all "clean" nodes
    massPingHubFromProxies(node);
  }
};

async function massPingHubFromProxies(rn) {
  // real node
  const owners = await models.Contact.findAll({
    where: {
      isOwner: true,
      id: { [Op.ne]: 1 },
    },
  });
  const nodes: { [k: string]: any }[] = [];
  await asyncForEach(owners, async (o:Contact) => {
    const proxyNodeInfo = await proxynodeinfo(o.publicKey);
    const clean = o.authToken === null || o.authToken === "";
    nodes.push({
      ...proxyNodeInfo,
      clean,
      last_active: o.lastActive,
      route_hint: o.routeHint,
      relay_commit: rn.relay_commit,
      lnd_version: rn.lnd_version,
      relay_version: rn.relay_version,
      testnet: rn.testnet,
      ip: rn.ip,
      public_ip: rn.public_ip,
      node_alias: rn.node_alias,
    });
  });
  sendHubCall({ nodes }, true);
}

async function sendHubCall(body, mass?: boolean) {
  try {
    // console.log("=> PING BODY", body)
    const r = await fetch(
      config.hub_api_url + (mass ? "/mass_ping" : "/ping"),
      {
        agent: pingAgent,
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );
    const j = await r.json();
    // console.log("=> PING RESPONSE", j)
    if (!(j && j.status && j.status === "ok")) {
      console.log("[hub] ping returned not ok", j);
    }
  } catch (e) {
    console.log("[hub warning]: cannot reach hub", e);
  }
}

const pingHubInterval = (ms) => {
  setInterval(pingHub, ms);
};

const checkInvitesHubInterval = (ms) => {
  setInterval(checkInviteHub, ms);
};

export function sendInvoice(payReq, amount) {
  console.log("[hub] sending invoice");
  fetch(config.hub_api_url + "/invoices", {
    method: "POST",
    body: JSON.stringify({ invoice: payReq, amount }),
    headers: { "Content-Type": "application/json" },
  }).catch((error) => {
    console.log("[hub error]: sendInvoice", error);
  });
}

const finishInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + "/invites/finish", {
    method: "POST",
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      console.log("[hub] finished invite to hub");
      onSuccess(json);
    })
    .catch((e) => {
      console.log("[hub] fail to finish invite in hub");
      onFailure(e);
    });
};

const payInviteInHub = (invite_string, params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + "/invites/" + invite_string + "/pay", {
    method: "POST",
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        console.log("[hub] finished pay to hub");
        onSuccess(json);
      } else {
        console.log("[hub] fail to pay invite in hub");
        onFailure(json);
      }
    });
};

async function payInviteInvoice(invoice, pubkey: string, onSuccess, onFailure) {
  try {
    const res = LND.sendPayment(invoice, pubkey);
    onSuccess(res);
  } catch (e) {
    onFailure(e);
  }
}

const createInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + "/invites_new", {
    method: "POST",
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        console.log("[hub] sent invite to be created to hub");
        onSuccess(json);
      } else {
        console.log("[hub] fail to create invite in hub");
        onFailure(json);
      }
    });
};

export async function getAppVersionsFromHub() {
  try {
    const r = await fetch(config.hub_api_url + "/app_versions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const j = await r.json();
    return j;
  } catch (e) {
    return null;
  }
}


export {
  pingHubInterval,
  checkInvitesHubInterval,
  sendHubCall,
  sendNotification,
  createInviteInHub,
  finishInviteInHub,
  payInviteInHub,
  payInviteInvoice,
  resetNotifyTribeCount,
};


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
