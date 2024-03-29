// https://github.com/antonilol/zbase32

const zbase32 = 'ybndrfg8ejkmcpqxot1uwisza345h769'
const zbase32Reverse = Object.fromEntries(
  zbase32.split('').map((x, i) => [x, BigInt(i)])
)

export function encode(buf: Buffer): string {
  let str = ''

  for (let i = 0; i < buf.length; i += 5) {
    // calculate chunk lengths
    const byteLength = Math.min(5, buf.length - i)
    const zbase32Length = Math.ceil((byteLength * 8) / 5)

    // bytes -> bigint
    const n =
      BigInt(buf.readUIntBE(i, byteLength)) << BigInt((5 - byteLength) * 8)

    // bigint -> zbase32
    for (let j = 0; j < zbase32Length; j++) {
      str += zbase32[Number(n >> BigInt((7 - j) * 5)) & 31]
    }
  }

  return str
}

export function decode(str: string): Buffer {
  const chunks: Buffer[] = []

  for (let i = 0; i < str.length; i += 8) {
    // calculate chunk lengths
    const zbase32Length = Math.min(8, str.length - i)
    const byteLength = Math.floor((zbase32Length * 5) / 8)

    // zbase32 -> bigint
    let n = BigInt(0)
    for (let j = 0; j < zbase32Length; j++) {
      n <<= BigInt(5)
      n |= zbase32Reverse[str[i + j]]
    }
    n <<= BigInt((8 - zbase32Length) * 5)

    // bigint -> bytes
    const chunk = Buffer.allocUnsafe(byteLength)
    chunk.writeUIntBE(Number(n >> BigInt((5 - byteLength) * 8)), 0, byteLength)
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}
