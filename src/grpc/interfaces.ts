

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
export function getInfoResponse(res): GetInfoResponse {
  if ('identity_pubkey' in res) { // LND
    return res;
  }
  if ('node_id' in res) { // greenlight
    return <GetInfoResponse>{
      identity_pubkey: Buffer.from(res.node_id).toString('hex'),
      version: res.version,
      alias: res.alias,
      color: res.color,
      num_peers: res.num_peers,
    };
  }
  return <GetInfoResponse>{}
}

