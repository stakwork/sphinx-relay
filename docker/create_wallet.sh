#!/usr/bin/expect -f

set WALLET_PASSWORD [lindex $argv 0]
set WALLET_PASSPHRASE [lindex $argv 1]

set force_conservative 0  ;# set to 1 to force conservative mode even if
                          ;# script wasn't run conservatively originally
if {$force_conservative} {
        set send_slow {1 .1}
        proc send {ignore arg} {
                sleep .1
                exp_send -s -- $arg
        }
}

set timeout -1
spawn lncli --lnddir=/relay/.lnd/ create
match_max 100000
expect -exact "Input wallet password: "
send -- "$WALLET_PASSWORD\r"
expect -exact "\r
Confirm password:\r
"
send -- "$WALLET_PASSWORD\r"
expect -exact "\r
\r
Do you have an existing cipher seed mnemonic you want to use? (Enter y/n): "
send -- "n\r"
expect -exact "n\r
\r
Your cipher seed can optionally be encrypted.\r
Input your passphrase if you wish to encrypt it (or press enter to proceed without a cipher seed passphrase): "
send -- "$WALLET_PASSPHRASE\r"
expect -exact "\r
Confirm password:\r
"
send -- "$WALLET_PASSPHRASE\r"
expect eof
