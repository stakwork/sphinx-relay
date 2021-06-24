import { loadConfig } from "../utils/config";
import * as ByteBuffer from 'bytebuffer'
import * as crypto from "crypto";

const config = loadConfig();

const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";

/* GET INFO */
interface Feature {
  name: string;
  is_required: boolean;
  is_known: string;
}
interface Chain {
  chain: string;
  network: string;
}
export interface GetInfoResponse {
  version: string;
  commit_hash: string;
  identity_pubkey: string;
  alias: string;
  color: string;
  num_pending_channels: number;
  num_active_channels: number;
  num_inactive_channels: number;
  num_peers: number;
  block_height: number;
  block_hash: string;
  best_header_timestamp: number;
  synced_to_chain: boolean;
  synced_to_graph: boolean;
  uris: string[];
  chains: Chain[];
  features: { [k: number]: Feature };
  testnet: boolean
}
interface GreenlightAddress {
  type: number;
  addr: string;
  port: number;
}
interface GreenlightGetInfoResponse {
  node_id: Buffer;
  alias: string;
  color: string;
  num_peers: number;
  addresses: GreenlightAddress[];
  version: string;
  blockheight: number;
  network: string;
}
export function getInfoResponse(
  res: GetInfoResponse | GreenlightGetInfoResponse
): GetInfoResponse {
  if (IS_LND) {
    // LND
    return res as GetInfoResponse;
  }
  if (IS_GREENLIGHT) {
    // greenlight
    const r = res as GreenlightGetInfoResponse;
    return <GetInfoResponse>{
      identity_pubkey: Buffer.from(r.node_id).toString("hex"),
      version: r.version,
      alias: r.alias,
      color: r.color,
      num_peers: r.num_peers,
      // FAKE VALUES
      num_active_channels: 0,
      num_pending_channels: 0,
      synced_to_chain: true,
      synced_to_graph: true,
      best_header_timestamp: 0,
      testnet: false,
    };
  }
  return <GetInfoResponse>{};
}

/* ADD INVOICE */
interface HopHint {
  node_id: string;
  chan_id: string;
  fee_base_msat?: number;
  fee_proportional_millionths?: number;
  cltv_expiry_delta?: number;
}
interface RouteHint {
  hop_hints: HopHint[];
}
export interface AddInvoiceRequest {
  value: number;
  memo?: string;
  route_hints?: RouteHint[];
  expiry?: number;
}
interface GreenlightAmount {
  millisatoshi?: number;
  satoshi?: number;
  bitcoin?: number;
}
interface GreenlightAddInvoiceRequest {
  amount: GreenlightAmount;
  label: string;
  description: string;
}
export function addInvoiceRequest(
  req: AddInvoiceRequest
): AddInvoiceRequest | GreenlightAddInvoiceRequest {
  if (IS_LND) return req;
  if (IS_GREENLIGHT) {
    const label = crypto.randomBytes(16).toString("hex").toUpperCase()
    return <GreenlightAddInvoiceRequest>{
      amount: {satoshi: req.value},
      label: label,
      description: req.memo,
    };
  }
  return <AddInvoiceRequest>{};
}
export interface AddInvoiceResponse {
  r_hash: Buffer;
  payment_request: string;
  add_index: number
}
enum GreenlightInvoiceStatus {
  UNPAID = 0,
	PAID = 1,
	EXPIRED = 2
}
interface GreenlightInvoice {
  label: string
	description: string
	millisatoshi?: number;
  satoshi?: number;
  bitcoin?: number;
	status: GreenlightInvoiceStatus
	payment_time: number
	expiry_time: number
	bolt11: string
	payment_hash: Buffer
	payment_preimage: Buffer
}
export function addInvoiceCommand(): string {
  if(IS_LND) return 'addInvoice'
  if(IS_GREENLIGHT) return 'createInvoice'
  return 'addInvoice'
}
export function addInvoiceResponse(
  res: AddInvoiceResponse | GreenlightInvoice
): AddInvoiceResponse {
  if (IS_LND) return res as AddInvoiceResponse;
  if (IS_GREENLIGHT) {
    const r = res as GreenlightInvoice
    return <AddInvoiceResponse>{
      payment_request: r.bolt11,
      r_hash: r.payment_hash,
      add_index: 0
    };
  }
  return <AddInvoiceResponse>{};
}

/* LIST CHANNELS */
interface ChannelConstraints {
  csv_delay: number;
  chan_reserve_sat: number;
  dust_limit_sat: number;
  max_pending_amt_msat: number;
  min_htlc_msat: number;
  max_accepted_htlcs: number;
}
interface HTLC {
  // ...
}
interface Channel {
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  chan_id: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
  commit_fee: string;
  commit_weight: string;
  fee_per_kw: string;
  unsettled_balance: number;
  total_satoshis_sent: number;
  total_satoshis_received: number;
  num_updates: number;
  pending_htlcs: HTLC[];
  csv_delay: number;
  private: boolean;
  initiator: boolean;
  chan_status_flags: string;
  local_chan_reserve_sat: string;
  remote_chan_reserve_sat: string;
  lifetime: number;
  uptime: number;
  close_address: string;
  push_amount_sat: number;
  thaw_height: number;
  local_constraints: ChannelConstraints;
  remote_constraints: ChannelConstraints;
}
export interface ListChannelsResponse {
  channels: Channel[]
}
interface GreenlightHTLC {
  direction: string;
  id: number;
  amount: string;
  expiry: number;
  payment_hash: string;
  state: string;
  local_trimmed: boolean;
}
interface GreenlightChannel {
  state: string;
  owner: string;
  short_channel_id: string;
  direction: number;
  channel_id: string;
  funding_txid: string;
  close_to_addr: string;
  close_to: string;
  private: boolean;
  total: string
  dust_limit: string
  spendable: string;
  receivable: string;
  their_to_self_delay: number;
  our_to_self_delay: number;
  status: string[];
  htlcs: GreenlightHTLC[];
}
interface GreenlightPeer {
  id: Buffer;
  connected: boolean;
  addresses: GreenlightAddress[];
  features: string
  channels: GreenlightChannel[];
}
interface GreenlightListPeersResponse {
  peers: GreenlightPeer[];
}
export function listChannelsResponse(
  res: ListChannelsResponse | GreenlightListPeersResponse
): ListChannelsResponse {
  if (IS_LND) return res as ListChannelsResponse;
  if (IS_GREENLIGHT) {
    const chans: Channel[] = [];
    (res as GreenlightListPeersResponse).peers.forEach((p:GreenlightPeer)=>{
      p.channels.forEach((ch:GreenlightChannel,i:number)=>{
        chans.push(<Channel>{
          active: ch.state === GreenlightChannelState.CHANNELD_NORMAL,
          remote_pubkey: Buffer.from(p.id).toString("hex"),
          channel_point: ch.funding_txid + ':' + i,
          chan_id: ch.channel_id,
          capacity: greelightNumber(ch.total) + '',
          local_balance: greelightNumber(ch.spendable) + '',
          remote_balance: greelightNumber(ch.receivable) + '',
        })
      })
    })
    return <ListChannelsResponse>{
      channels: chans,
    };
  }
  return <ListChannelsResponse>{};
}
export function listChannelsCommand(): string {
  if(IS_LND) return 'listChannels'
  if(IS_GREENLIGHT) return 'listPeers'
  return 'listChannels'
}
export interface ListChannelsArgs {
  active_only?: boolean
  inactive_only?: boolean
  peer?: string // HEX!
}
export function listChannelsRequest(args?:ListChannelsArgs): {[k:string]:any} {
  const opts:{[k:string]:any} = args || {}
  if(args && args.peer) {
    if(IS_LND) opts.peer = ByteBuffer.fromHex(args.peer)
    if(IS_GREENLIGHT) opts.node_id = args.peer
  }
  return opts
}

function greelightNumber(s: string): number {
  if (s.endsWith('msat')) {
    const s1 = s.substr(0, s.length-4)
    return Math.floor(parseInt(s1)/1000)
  }
  if (s.endsWith('sat')) {
    const s1 = s.substr(0, s.length-3)
    return parseInt(s1)
  } 
  return 0
}

enum GreenlightChannelState {
	CHANNELD_AWAITING_LOCKIN = 'CHANNELD_AWAITING_LOCKIN',
	/* Normal operating state. */
	CHANNELD_NORMAL = 'CHANNELD_NORMAL',
	/* We are closing, pending HTLC resolution. */
	CHANNELD_SHUTTING_DOWN = 'CHANNELD_SHUTTING_DOWN',
	/* Exchanging signatures on closing tx. */
	CLOSINGD_SIGEXCHANGE = 'CLOSINGD_SIGEXCHANGE',
	/* Waiting for onchain event. */
	CLOSINGD_COMPLETE = 'CLOSINGD_COMPLETE',
	/* Waiting for unilateral close to hit blockchain. */
	AWAITING_UNILATERAL = 'AWAITING_UNILATERAL',
	/* We've seen the funding spent, we're waiting for onchaind. */
	FUNDING_SPEND_SEEN = 'FUNDING_SPEND_SEEN',
	/* On chain */
	ONCHAIN = 'ONCHAIN',
	/* Final state after we have fully settled on-chain */
	CLOSED = 'CLOSED',
	/* For dual-funded channels, we start at a different state.
	 * We transition to 'awaiting lockin' after sigs have
	 * been exchanged */
	DUALOPEND_OPEN_INIT = 'DUALOPEND_OPEN_INIT',
	/* Dual-funded channel, waiting for lock-in */
	DUALOPEND_AWAITING_LOCKIN = 'DUALOPEND_AWAITING_LOCKIN',
};

/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)

listChannels?
*/
