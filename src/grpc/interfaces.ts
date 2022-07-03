import { loadConfig } from '../utils/config'
import * as ByteBuffer from 'bytebuffer'
import * as crypto from 'crypto'
import { LND_KEYSEND_KEY } from './lightning'
import * as long from 'long'

const config = loadConfig()

const IS_LND = config.lightning_provider === 'LND'
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'

/* GET INFO */
interface Feature {
  name: string
  is_required: boolean
  is_known: string
}
interface Chain {
  chain: string
  network: string
}
export interface GetInfoResponse {
  version: string
  commit_hash: string
  identity_pubkey: string
  alias: string
  color: string
  num_pending_channels: number
  num_active_channels: number
  num_inactive_channels: number
  num_peers: number
  block_height: number
  block_hash: string
  best_header_timestamp: number
  synced_to_chain: boolean
  synced_to_graph: boolean
  uris: string[]
  chains: Chain[]
  features: { [k: number]: Feature }
  testnet: boolean
}
interface GreenlightAddress {
  type: number
  addr: string
  port: number
}
interface GreenlightGetInfoResponse {
  node_id: Buffer
  alias: string
  color: string
  num_peers: number
  addresses: GreenlightAddress[]
  version: string
  blockheight: number
  network: string
}
export function getInfoResponse(
  res: GetInfoResponse | GreenlightGetInfoResponse
): GetInfoResponse {
  if (IS_LND) {
    // LND
    return res as GetInfoResponse
  }
  if (IS_GREENLIGHT) {
    // greenlight
    const r = res as GreenlightGetInfoResponse
    return <GetInfoResponse>{
      identity_pubkey: Buffer.from(r.node_id).toString('hex'),
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
    }
  }
  return <GetInfoResponse>{}
}

/* ADD INVOICE */
interface HopHint {
  node_id: string
  chan_id: string
  fee_base_msat?: number
  fee_proportional_millionths?: number
  cltv_expiry_delta?: number
}
interface RouteHint {
  hop_hints: HopHint[]
}
export interface AddInvoiceRequest {
  value: number
  memo?: string
  route_hints?: RouteHint[]
  expiry?: number
}
type GreenlightAmountUnit = 'millisatoshi' | 'satoshi' | 'bitcoin' | 'all' | 'any'
interface GreenlightAmount {
  unit: GreenlightAmountUnit
  millisatoshi?: string
  satoshi?: string
  bitcoin?: string
}
interface GreenlightAddInvoiceRequest {
  amount: GreenlightAmount
  label: string
  description: string
}
function makeLabel() {
  return crypto.randomBytes(16).toString('hex').toUpperCase()
}
export function addInvoiceRequest(
  req: AddInvoiceRequest
): AddInvoiceRequest | GreenlightAddInvoiceRequest {
  if (IS_LND) return req
  if (IS_GREENLIGHT) {
    return <GreenlightAddInvoiceRequest>{
      amount: { unit: 'satoshi', satoshi: req.value + '' },
      label: makeLabel(),
      description: req.memo,
    }
  }
  return <AddInvoiceRequest>{}
}
export interface AddInvoiceResponse {
  r_hash: Buffer
  payment_request: string
  add_index: number
}
enum GreenlightInvoiceStatus {
  UNPAID = 0,
  PAID = 1,
  EXPIRED = 2,
}
interface GreenlightInvoice {
  label: string
  description: string
  millisatoshi?: number
  satoshi?: number
  bitcoin?: number
  status: GreenlightInvoiceStatus
  payment_time: number
  expiry_time: number
  bolt11: string
  payment_hash: Buffer
  payment_preimage: Buffer
}
export function addInvoiceCommand(): 'addInvoice' | 'createInvoice' {
  if (IS_LND) return 'addInvoice'
  if (IS_GREENLIGHT) return 'createInvoice'
  return 'addInvoice'
}
export function addInvoiceResponse(
  res: AddInvoiceResponse | GreenlightInvoice
): AddInvoiceResponse {
  if (IS_LND) return res as AddInvoiceResponse
  if (IS_GREENLIGHT) {
    const r = res as GreenlightInvoice
    return <AddInvoiceResponse>{
      payment_request: r.bolt11,
      r_hash: r.payment_hash,
      add_index: 0,
    }
  }
  return <AddInvoiceResponse>{}
}

/* LIST CHANNELS */
interface ChannelConstraints {
  csv_delay: number
  chan_reserve_sat: number
  dust_limit_sat: number
  max_pending_amt_msat: number
  min_htlc_msat: number
  max_accepted_htlcs: number
}
interface HTLC {
  incoming: boolean
  amount: string
  hash_lock: Buf
  expiration_height: number
  htlc_index: string
  forwarding_channel: string
  forwarding_htlc_index: string
}
export interface Channel {
  active: boolean
  remote_pubkey: string
  channel_point: string
  chan_id: string
  capacity: string
  local_balance: string
  remote_balance: string
  commit_fee: string
  commit_weight: string
  fee_per_kw: string
  unsettled_balance: number
  total_satoshis_sent: number
  total_satoshis_received: number
  num_updates: number
  pending_htlcs: HTLC[]
  csv_delay: number
  private: boolean
  initiator: boolean
  chan_status_flags: string
  local_chan_reserve_sat: string
  remote_chan_reserve_sat: string
  lifetime: number
  uptime: number
  close_address: string
  push_amount_sat: number
  thaw_height: number
  local_constraints: ChannelConstraints
  remote_constraints: ChannelConstraints
}
export interface ListChannelsResponse {
  channels: Channel[]
}
interface GreenlightHTLC {
  direction: string
  id: number
  amount: string // int64
  expiry: number
  payment_hash: string
  state: string
  local_trimmed: boolean
}
interface GreenlightChannel {
  state: string
  owner: string
  short_channel_id: string
  direction: number
  channel_id: string
  funding_txid: string
  close_to_addr: string
  close_to: string
  private: boolean
  total: string
  dust_limit: string
  spendable: string
  receivable: string
  their_to_self_delay: number
  our_to_self_delay: number
  status: string[]
  htlcs: GreenlightHTLC[]
}
interface GreenlightPeer {
  id: Buffer
  connected: boolean
  addresses: GreenlightAddress[]
  features: string
  channels: GreenlightChannel[]
}
interface GreenlightListPeersResponse {
  peers: GreenlightPeer[]
}
export function listChannelsResponse(
  res: ListChannelsResponse | GreenlightListPeersResponse
): ListChannelsResponse {
  if (IS_LND) return res as ListChannelsResponse
  if (IS_GREENLIGHT) {
    const chans: Channel[] = []
    ;(res as GreenlightListPeersResponse).peers.forEach((p: GreenlightPeer) => {
      p.channels.forEach((ch: GreenlightChannel, i: number) => {
        chans.push(<Channel>{
          active: ch.state === GreenlightChannelState.CHANNELD_NORMAL,
          remote_pubkey: Buffer.from(p.id).toString('hex'),
          channel_point: ch.funding_txid + ':' + i,
          chan_id: shortChanIDtoInt64(ch.channel_id),
          capacity: greelightNumber(ch.total) + '',
          local_balance: greelightNumber(ch.spendable) + '',
          remote_balance: greelightNumber(ch.receivable) + '',
        })
      })
    })
    return <ListChannelsResponse>{
      channels: chans,
    }
  }
  return <ListChannelsResponse>{}
}
export function listChannelsCommand(): 'listChannels' | 'listPeers' {
  if (IS_LND) return 'listChannels'
  if (IS_GREENLIGHT) return 'listPeers'
  return 'listChannels'
}
export interface ListChannelsArgs {
  active_only?: boolean
  inactive_only?: boolean
  peer?: string // HEX!
}
export function listChannelsRequest(args?: ListChannelsArgs): {
  [k: string]: any
} {
  const opts: { [k: string]: any } = args || {}
  if (args && args.peer) {
    if (IS_LND) opts.peer = ByteBuffer.fromHex(args.peer)
    if (IS_GREENLIGHT) opts.node_id = args.peer
  }
  return opts
}

export interface ListPeersArgs {
  node_id?: string
}
export function listPeersRequest(args?: ListPeersArgs): {
  [k: string]: any
} {
  const opts: { [k: string]: any } = args || {}
  if (IS_GREENLIGHT && args && args.node_id) {
    opts.node_id = ByteBuffer.fromHex(args.node_id)
  }
  return opts
}

interface Peer {
  pub_key: string
  address: string // eg `127.0.0.1:10011`
}
export interface ListPeersResponse {
  peers: Peer[]
}
export function listPeersResponse(
  res: ListPeersResponse | GreenlightListPeersResponse
): ListPeersResponse {
  if (IS_LND) return res as ListPeersResponse
  if (IS_GREENLIGHT) {
    return <ListPeersResponse>{
      peers: (res as GreenlightListPeersResponse).peers.map(
        (p: GreenlightPeer) => {
          const addy = p.addresses[0]
          const peer: Peer = {
            pub_key: Buffer.from(p.id).toString('hex'),
            address: addy
              ? addy.port
                ? `${addy.addr}:${addy.port}`
                : addy.addr
              : '',
          }
          return peer
        }
      ),
    }
  }
  return <ListPeersResponse>{}
}

export type Buf = Buffer | ByteBuffer | ArrayBuffer
type DestCustomRecords = { [key: string]: Buf }
export interface KeysendRequest {
  amt: number
  final_cltv_delta: number
  dest: Buf
  dest_custom_records: DestCustomRecords
  payment_hash: Buf
  dest_features: number[]
  route_hints?: RouteHint[]
  fee_limit?: { [k: string]: number }
  fee_limit_sat?: number
  timeout_seconds?: number
}
interface GreenlightHop {
  node_id: Buf
  short_channel_id: string
  fee_base?: string
  fee_prop?: number
  cltv_expiry_delta?: number
}
type GreenlightRoutehint = GreenlightHop[]
interface GreenlightTLV {
  type: string
  value: Buf
}
interface GreenlightKeysendRequest {
  node_id: Buf
  amount: GreenlightAmount
  label: string
  routehints?: GreenlightRoutehint[]
  extratlvs?: GreenlightTLV[]
}
export function keysendRequest(
  req: KeysendRequest
): KeysendRequest | GreenlightKeysendRequest {
  if (IS_LND) return req
  if (IS_GREENLIGHT) {
    const r = <GreenlightKeysendRequest>{
      node_id: req.dest,
      amount: { unit: 'satoshi', satoshi: req.amt + '' },
      label: makeLabel(),
    }
    if (req.route_hints) {
      r.routehints = req.route_hints.map((rh) => {
        const hops: GreenlightHop[] = rh.hop_hints.map((hh) => {
          return <GreenlightHop>{
            node_id: ByteBuffer.fromHex(hh.node_id),
            short_channel_id: shortChanIDfromInt64(hh.chan_id),
            fee_base: '1000',
            fee_prop: 1,
            cltv_expiry_delta: 40,
          }
        })
        return hops
      })
    }
    if (req.dest_custom_records) {
      const dest_recs: GreenlightTLV[] = []
      Object.entries(req.dest_custom_records).forEach(([type, value]) => {
        if (type === `${LND_KEYSEND_KEY}`) return
        dest_recs.push({ type, value })
      })
      r.extratlvs = dest_recs
    }
    return r
  }
  return <KeysendRequest>{}
}
interface Hop {
  chan_id: string
  chan_capacity: string
  amt_to_forward: string
  fee: string
  expiry: number
  amt_to_forward_msat: string
  fee_msat: string
  pub_key: string
  custom_records: DestCustomRecords
}
export interface Route {
  total_time_lock: number
  total_fees: string // deprecated
  total_amt: string // deprecated
  hops: Hop[]
  total_fees_msat: string
  total_amt_msat: string
}
export interface SendPaymentResponse {
  payment_error: string
  payment_preimage: Buf
  payment_route: Route
  payment_hash: Buf
}
enum GreenlightPaymentStatus {
  PENDING = 0,
  COMPLETE = 1,
  FAILED = 2,
}
export interface GreenlightPayment {
  destination: Buf
  payment_hash: Buf
  payment_preimage: Buf
  status: GreenlightPaymentStatus
  amount: GreenlightAmount
  amount_sent: GreenlightAmount
}
export function keysendResponse(
  res: SendPaymentResponse | GreenlightPayment
): SendPaymentResponse {
  if (IS_LND) return res as SendPaymentResponse
  if (IS_GREENLIGHT) {
    const r = res as GreenlightPayment
    const route = <Route>{}
    const { satoshi, millisatoshi } = greenlightAmoutToAmounts(r.amount)
    route.total_amt = satoshi
    route.total_amt_msat = millisatoshi
    return <SendPaymentResponse>{
      payment_error:
        r.status === GreenlightPaymentStatus.FAILED ? 'payment failed' : '',
      payment_preimage: r.payment_preimage,
      payment_hash: r.payment_hash,
      payment_route: route,
    }
  }
  return <SendPaymentResponse>{}
}

export function subscribeCommand(): 'subscribeInvoices' | 'streamIncoming' {
  if (IS_LND) return 'subscribeInvoices'
  if (IS_GREENLIGHT) return 'streamIncoming'
  return 'subscribeInvoices'
}
export enum InvoiceState {
  OPEN = 'OPEN',
  SETTLED = 'SETTLED',
  CANCELED = 'CANCELED',
  ACCEPTED = 'ACCEPTED',
}
enum InvoiceHTLCState {
  ACCEPTED = 0,
  SETTLED = 1,
  CANCELED = 2,
}
interface InvoiceHTLC {
  chan_id: string
  htlc_index: number
  amt_msat: string
  accept_height: number
  accept_time: string
  resolve_time: string
  expiry_height: number
  state: InvoiceHTLCState
  custom_records: DestCustomRecords
}
export interface Invoice {
  memo: string
  r_preimage: Buf
  r_hash: Buf
  value: string
  value_msat: string
  settled: boolean
  creation_date: string
  settle_date: string
  payment_request: string
  description_hash: Buf
  expiry: string
  fallback_addr: string
  cltv_expiry: string
  route_hints: RouteHint[]
  private: boolean
  add_index: string
  settle_index: string
  amt_paid: string
  amt_paid_sat: string
  amt_paid_msat: string
  state: InvoiceState
  htlcs: InvoiceHTLC[]
  features: { [k: string]: any }
  is_keysend: boolean
}
interface GreenlightOffchainPayment {
  label: string
  preimage: Buf
  amount: GreenlightAmount
  extratlvs: GreenlightTLV[]
  payment_hash: Buf
  bolt11: string
}
interface GreenlightIncomingPayment {
  offchain: GreenlightOffchainPayment
}
export function subscribeResponse(
  res: Invoice | GreenlightIncomingPayment
): Invoice {
  if (IS_LND) return res as Invoice
  if (IS_GREENLIGHT) {
    const r1 = res as GreenlightIncomingPayment
    if (!r1.offchain) return <Invoice>{}
    const r = r1.offchain
    const custom_records = <DestCustomRecords>{}
    let is_keysend = false
    if (r.extratlvs) {
      r.extratlvs.forEach((tlv) => {
        // console.log("TLV TYPE", tlv.type, typeof tlv.type, `${LND_KEYSEND_KEY}`)
        // if(tlv.type===`${LND_KEYSEND_KEY}`) is_keysend=true
        custom_records[tlv.type] = tlv.value
      })
    }
    if (r.label.startsWith('keysend')) is_keysend = true
    const i = <Invoice>{
      memo: r.label,
      r_preimage: r.preimage,
      is_keysend,
      htlcs: [<InvoiceHTLC>{ custom_records }],
      state: InvoiceState.SETTLED,
      r_hash: r.payment_hash,
      payment_request: r.bolt11,
    }
    const { satoshi, millisatoshi } = greenlightAmoutToAmounts(r.amount)
    i.value = satoshi
    i.value_msat = millisatoshi
    i.amt_paid_sat = satoshi
    i.amt_paid_msat = millisatoshi
    return i
  }
  return <Invoice>{}
}

export interface Addr {
  pubkey: string
  host: string
}
export interface ConnectPeerArgs {
  addr: Addr
}
interface GreenlightConnectPeerArgs {
  node_id: string
  addr: string
}
export function connectPeerRequest(
  req: ConnectPeerArgs
): ConnectPeerArgs | GreenlightConnectPeerArgs {
  if (IS_LND) return req
  if (IS_GREENLIGHT) {
    return <GreenlightConnectPeerArgs>{
      node_id: req.addr.pubkey,
      addr: req.addr.host,
    }
  }
  return <ConnectPeerArgs>{}
}
type ConnectPeerResponse = { [k: string]: any }
interface GreenlightConnectPeerResponse {
  node_id: string
  features: string
}
export function connectPeerResponse(
  res: ConnectPeerResponse | GreenlightConnectPeerResponse
): ConnectPeerResponse {
  if (IS_LND) return res as ConnectPeerResponse
  if (IS_GREENLIGHT) {
    return <GreenlightConnectPeerResponse>{}
  }
  return <ConnectPeerResponse>{}
}

interface AmountsRes {
  satoshi: string
  millisatoshi: string
}
export function greenlightAmoutToAmounts(a: GreenlightAmount): AmountsRes {
  let satoshi = ''
  let millisatoshi = ''
  if (a.unit === 'satoshi') {
    satoshi = a.satoshi || '0'
    millisatoshi = parseInt(a.satoshi || '0') * 1000 + ''
  } else if (a.unit === 'millisatoshi') {
    satoshi = Math.floor(parseInt(a.millisatoshi || '0') / 1000) + ''
    millisatoshi = a.millisatoshi + ''
  }
  return { satoshi, millisatoshi }
}
function greelightNumber(s: string): number {
  if (s.endsWith('msat')) {
    const s1 = s.substr(0, s.length - 4)
    return Math.floor(parseInt(s1) / 1000)
  }
  if (s.endsWith('sat')) {
    const s1 = s.substr(0, s.length - 3)
    return parseInt(s1)
  }
  return 0
}

export function greenlightSignMessagePayload(msg: Buffer): string {
  const type = 23
  const length = msg.length
  const typebuf = Buffer.allocUnsafe(2)
  typebuf.writeUInt16BE(type, 0)
  const lengthbuf = Buffer.allocUnsafe(2)
  lengthbuf.writeUInt16BE(length, 0)
  const buf = Buffer.concat([typebuf, lengthbuf, msg], 4 + length)
  return buf.toString('hex')
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
}

function shortChanIDfromInt64(int: string): string {
  if (typeof int !== 'string') return ''
  const l = long.fromString(int, true)
  const blockHeight = l.shiftRight(40)
  const txIndex = l.shiftRight(16).and(0xffffff)
  const txPosition = l.and(0xffff)
  if (IS_GREENLIGHT) {
    return `${blockHeight.toString()}x${txIndex.toString()}x${txPosition.toString()}`
  }
  return `${blockHeight.toString()}:${txIndex.toString()}:${txPosition.toString()}`
}

function shortChanIDtoInt64(cid: string): string {
  if (typeof cid !== 'string') return ''
  if (!(cid.includes(':') || cid.includes('x'))) return ''

  let a: string[] = []
  const seps = [':', 'x']
  for (const sep of seps) {
    if (cid.includes(sep)) a = cid.split(sep)
  }
  if (!a) return ''
  if (!Array.isArray(a)) return ''
  if (!(a.length === 3)) return ''

  const blockHeight = long.fromString(a[0], true).shiftLeft(40)
  const txIndex = long.fromString(a[1], true).shiftLeft(16)
  const txPosition = long.fromString(a[2], true)

  return blockHeight.or(txIndex).or(txPosition).toString()
}
