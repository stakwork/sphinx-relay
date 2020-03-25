const apis = [{
  name: 'relay',
  url: '/',
}, {
  name: 'media',
  url: window.location.hostname==='localhost'?'http://localhost:5000/':'http://memes.sphinx.chat/',
  tokenName: '__sphinx__media__token__'
}]

const methods = ["GET", "POST", "PUT", "DELETE", "UPLOAD", "BLOB"]

function createAPIs(apis) {
  const r = {}
  apis.forEach(a => r[a.name] = createAPI(a))
  return r
}

// "fields" is only for UPLOAD (extra fields)
function createAPI(def) {
  const api = {}
  api.tokenName = def.tokenName
  methods.forEach(m => {
    api[m] = async function (url, data, fields) {
      try {
        const token = await getToken(def.tokenName)
        const skip = isPublic(def.url + url)
        if (def.tokenName && !token && !skip) {
          throw new Error("no token")
        }
        const headers = {}
        if (def.tokenName && token) headers['authorization'] = 'Bearer ' + token
        const opts = {mode: 'cors'}
        if (m === 'POST' || m === 'PUT') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
          opts.body = new URLSearchParams(data)
        }
        if (m === 'UPLOAD') {
          const file = data
          const filename = file.name || 'name'
          const type = file.type || 'application/octet-stream'
          let formData = new FormData();
          formData.append('file', new Blob([file], { type }), filename)
          Object.entries(fields).forEach(e=> formData.append(e[0], e[1]))
          opts.body = formData
        }
        opts.headers = new Headers(headers)
        opts.method = m==='UPLOAD' ? 'POST' : m
        if(m==='BLOB') opts.method='GET'
        const r = await fetch(def.url + url, opts);
        if (!r.ok) {
          console.log(r)
          throw new Error('Not OK!');
        }
        let res
        if(m==='BLOB') res = await r.blob()
        else {
          res = await r.json();
          if (res.token) {
            localStorage.setItem(def.tokenName, res.token)
          }
        }
        return res
      } catch (e) {
        throw e
      }
    }
  })
  return api
}

function isPublic(url) {
  return url.endsWith('ask') || 
    url.endsWith('verify')
}

const { relay, media } = createAPIs(apis)
export {
  relay,
  media,
}

async function getToken(name) {
  if (!name) return ""
  return localStorage.getItem(name)
}

// let formData = new FormData();
// formData.append('file', new Blob([file]))
// formData.append('filename', filename);
// if(filetype)  {
//     formData.append('filetype', filetype);
// }
