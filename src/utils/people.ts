import { loadConfig } from "./config";
import {genSignedTimestamp} from './tribes'
import fetch from "node-fetch";

const config = loadConfig();

export async function createOrEditPerson({
  host,
  owner_alias,
  owner_pubkey,
  owner_route_hint,
  description,
  img,
  tags,
  price_to_meet,
}, id?:number) {
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    const r = await fetch(protocol + "://" + host + "/person?token=" + token, {
      method: "POST",
      body: JSON.stringify({
        ...id && {id}, // id optional (for editing)
        owner_alias,
        owner_pubkey,
        owner_route_hint,
        description,
        img,
        tags: tags || [],
        price_to_meet: price_to_meet || 0,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) {
      throw 'failed to create or edit person' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    console.log("[tribes] unauthorized to create person");
    throw e;
  }
}

export async function deletePerson(host, id, owner_pubkey) {
  try {
    const token = await genSignedTimestamp(owner_pubkey);
    let protocol = "https";
    if (config.tribes_insecure) protocol = "http";
    const r = await fetch(`${protocol}://${host}/person/${id}?token=${token}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      throw 'failed to delete person' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    console.log("[tribes] unauthorized to delete person");
    throw e;
  }
}