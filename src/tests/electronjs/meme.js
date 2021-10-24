import { decode } from 'base-64'
import { randomBytes } from 'crypto'
import { Encrypt } from 'jscryptor-2'
import fetch from 'node-fetch'
import * as FormData from 'form-data'

async function uploadMeme(fileBase64, typ, host, token, filename, isPublic) {
  try {
    let imgBuf = dataURLtoBuf(fileBase64)

    let finalImgBuffer
    let newKey = ''
    if (isPublic) {
      finalImgBuffer = Buffer.from(imgBuf)
    } else {
      newKey = randomBytes(20).toString('hex')
      const encImgBase64 = Encrypt(imgBuf, newKey)
      finalImgBuffer = Buffer.from(encImgBase64, 'base64')
    }

    const form = new FormData()
    form.append('file', finalImgBuffer, {
      contentType: typ || 'image/jpg',
      filename: filename || 'Image.jpg',
      knownLength: finalImgBuffer.length,
    })
    const formHeaders = form.getHeaders()
    let protocol = 'https'
    if (host.includes('localhost')) protocol = 'http'
    const resp = await fetch(
      `${protocol}://${host}/${isPublic ? 'public' : 'file'}`,
      {
        method: 'POST',
        headers: {
          ...formHeaders, // THIS IS REQUIRED!!!
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    )

    let json = await resp.json()
    if (!json.muid) throw new Error('no muid')

    return {
      muid: json.muid,
      media_key: newKey,
    }
  } catch (e) {
    throw e
  }
}

export { uploadMeme }

function dataURLtoBuf(dataurl) {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = decode(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return u8arr
}
