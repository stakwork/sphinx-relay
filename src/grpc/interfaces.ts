import { loadConfig } from "../utils/config";
import * as ByteBuffer from 'bytebuffer'

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
  node_id: ArrayBuffer;
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
    };
  }
  return <GetInfoResponse>{};
}

/* ADD INVOICE */
interface HopHint {
  node_id: string;
  chan_id: string;
  fee_base_msat: number;
  fee_proportional_millionths: number;
  cltv_expiry_delta: number;
}
interface RouteHint {
  hop_hints: HopHint[];
}
interface AddInvoiceRequest {
  memo: string;
  value: number;
  route_hints: RouteHint[];
  expiry: number;
}
interface GreenlightAddInvoiceRequest {
  millisatoshi?: number;
  satoshi?: number;
  bitcoin?: number;
  label: string;
  description: string;
}
export function addInvoiceRequest(
  req: AddInvoiceRequest
): AddInvoiceRequest | GreenlightAddInvoiceRequest {
  if (IS_LND) return req;
  if (IS_GREENLIGHT) {
    return <GreenlightAddInvoiceRequest>{
      satoshi: req.value,
      label: req.memo,
      description: req.memo,
    };
  }
  return <AddInvoiceRequest>{};
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
  capacity: number;
  local_balance: number;
  remote_balance: number;
  commit_fee: number;
  commit_weight: number;
  fee_per_kw: number;
  unsettled_balance: number;
  total_satoshis_sent: number;
  total_satoshis_received: number;
  num_updates: number;
  pending_htlcs: HTLC[];
  csv_delay: number;
  private: boolean;
  initiator: boolean;
  chan_status_flags: string;
  local_chan_reserve_sat: number;
  remote_chan_reserve_sat: number;
  lifetime: number;
  uptime: number;
  close_address: string;
  push_amount_sat: number;
  thaw_height: number;
  local_constraints: ChannelConstraints;
  remote_constraints: ChannelConstraints;
}
interface ListChannelsResponse {
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
  id: ArrayBuffer;
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
      p.channels.forEach((ch:GreenlightChannel)=>{
        chans.push(<Channel>{
          active: ch.state === 'active',
          remote_pubkey: Buffer.from(p.id).toString("hex"),
          channel_point: ch.funding_txid,
          chan_id: ch.channel_id,
          capacity: Number(ch.total),
          local_balance: Number(ch.spendable),
          remote_balance: Number(ch.receivable),
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

/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)

listChannels?
*/
