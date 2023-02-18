// Original file: proto/walletkit.proto

export interface ListAddressesRequest {
  account_name?: string
  show_custom_accounts?: boolean
}

export interface ListAddressesRequest__Output {
  account_name: string
  show_custom_accounts: boolean
}
