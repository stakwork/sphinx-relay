
var http = require('http')
var fs = require('fs');
var path = require('path');
/*
{
    alice: [
        {type:'error': 'text':...}
    ],
    bob: {
        ...
    }
}
*/
let logs = {}

function set(name, kind, line) {
    if(!logs[name]) logs[name] = []
    logs[name].push({
        type: kind,
        text: line
    })
}

function setLog(name, line) {
    set(name, 'log', line)
}

function setError(name, line) {
    set(name, 'error', line)
}

function getlogs(req, res) {
    respond(res, logs)
}  

function start() {
    const hostname = '127.0.0.1';
    const port = 3333;
    http.createServer((req, res) => {
        if (req.method==='OPTIONS') {
            return end(res, 200, '')
        }
        // console.log("=>", req.url, req.method)
        if (req.url==='/logs' && req.method==='GET') {
            return getlogs(req, res)
        }

        var filePath = '.' + req.url;
        if (filePath == './') {
            filePath = './index.html';
        }

        let thepath = './testing/console/public/' + filePath.substr(2)

        var extname = String(path.extname(thepath)).toLowerCase();
        var mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
        };

        var contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(thepath, function(error, content) {
            if (error) {
                res.writeHead(500);
                res.end('Nope: '+error.code+' ..\n');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });

    }).listen(port, hostname, () => {
        console.log('*********************************************')
        console.log(`Server running at http://${hostname}:${port}/`)
        console.log('*********************************************')
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