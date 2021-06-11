import { loadConfig } from '../utils/config'

const config = loadConfig()

const IS_LND = config.lightning_provider==='LND'
const IS_GREENLIGHT = config.lightning_provider==='GREENLIGHT'

interface Feature {
  name: string;
  is_required: boolean;
  is_known: string;
}
interface Chain {
  chain: string;
  network: string;
}
interface GetInfoResponse {
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
}
interface GreenlightAddress {
  type: number
	addr: string
	port: number
}
interface GreenlightGetInfoResponse {
    node_id: ArrayBuffer
    alias: string
    color: string
    num_peers: number
    addresses: GreenlightAddress[]
    version: string
    blockheight: number
    network: string
}
export function getInfoResponse(res:GetInfoResponse|GreenlightGetInfoResponse): GetInfoResponse {
  if (IS_LND) { // LND
    return res as GetInfoResponse;
  }
  if (IS_GREENLIGHT) { // greenlight
    const r = res as GreenlightGetInfoResponse
    return <GetInfoResponse>{
      identity_pubkey: Buffer.from(r.node_id).toString('hex'),
      version: r.version,
      alias: r.alias,
      color: r.color,
      num_peers: r.num_peers,
    };
  }
  return <GetInfoResponse>{}
}

interface HopHint {
  node_id: string
  chan_id: string
  fee_base_msat: number
  fee_proportional_millionths: number
  cltv_expiry_delta: number
}
interface RouteHint {
  hop_hints: HopHint[]
}
interface AddInvoiceRequest {
  memo: string
  value: number
  route_hints: RouteHint[]
  expiry: number
}
interface GreenlightAddInvoiceRequest {
  millisatoshi?: number
  satoshi?: number
  bitcoin?: number
  label: string
  description: string
}
export function addInvoiceRequest(req:AddInvoiceRequest): AddInvoiceRequest|GreenlightAddInvoiceRequest {
  if(IS_LND) return req
  if(IS_GREENLIGHT) {
    return <GreenlightAddInvoiceRequest>{
      satoshi: req.value,
      label: req.memo,
      description: req.memo,
    }
  }
  return <AddInvoiceRequest>{}
}

/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)


*/