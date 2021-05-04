
var http = require('http')

/*
{
    alice: {
        logs: ['line one\n', 'line two\n'],
        errors: ['error one\n']
    },
    bob: {
        ...
    }
}
*/
let logs = {}

function set(name, kind, line) {
    if(!logs[name]) logs[name] = {}
    if(logs[name][kind]) {
        logs[name][kind].push(line)
    } else {
        logs[name][kind] = [line]
    }
}

function setLog(name, line) {
    set(name, 'logs', line)
}

function setError(name, line) {
    set(name, 'errors', line)
}

function getlogs(req, res) {
    respond(res, logs)
}  

function start() {
    const hostname = '127.0.0.1';
    const port = 3335;
    http.createServer((req, res) => {
    if (req.method==='OPTIONS') {
        return end(res, 200, '')
    }
    console.log("=>", req.url, req.method)
    if (req.url==='/log' && req.method==='GET') {
        getlogs(req, res)
    }
    }).listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    })
}

function respond(res, response) {
  end(res, 200, JSON.stringify(response))
}

function failure(res, response) {
  end(res, 401, JSON.stringify({error: response}))  
}

function readBody(req) {
  return new Promise((resolve,reject)=>{
    req.setEncoding('utf8');
    req.on('data', function (data) {
      try {
        const body = JSON.parse(data)
        resolve(body)
      } catch(e) {
        reject(e)
      }
    })
  }) 
}

function end(res, status, data) {
  const headers = {}
  headers['Content-Type'] = 'application/json'
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Credentials"] = false;
  headers["Access-Control-Max-Age"] = '86400'; // 24 hours
  headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
  res.writeHead(200, headers);
  res.end(data)
}

module.exports = {
    start, setLog, setError
}