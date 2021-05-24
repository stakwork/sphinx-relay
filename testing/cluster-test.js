
import child_process from 'child_process'
import chalk from 'chalk'
import * as srv from './cluster-srv.js'
import minimist from 'minimist'
import * as fs from 'fs'

function requireJson(path) {
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

let config = requireJson('./testing/cluster_config.json')

const argv = minimist(process.argv.slice(2));
const skip = argv.skip?argv.skip.split(','):[]
const only = argv.only?argv.only.split(','):[]

const isOnly = only.length>0
if(!isOnly) srv.start() //to prevent overlap of ports

console.log("Node Version: ", process.version);

const relay_nodes = [
    {name: "alice", color: "blue"},
    {name: "bob", color: "red"},
    {name: "carol", color: "green"},
    {name: "dave", color: "magenta"} // proxy
]
const go_nodes = [
    {name:'proxy', color:'bgBlue'},
    {name:'auth', color:'bgGreen'},
    {name:'mqtt', color:'bgMagenta'},
    {name:'tribes', color:'bgCyan'},
    {name:'meme', color:'bgYellow'}
]

const cliArgs = {
    'proxy': [
        `--tlscertpath=${config.path}sphinx-proxy/cert/tls.cert`,
        `--tlskeypath=${config.path}sphinx-proxy/cert/tls.key`,
        `--server-macaroons-dir=${config.path}sphinx-proxy/macaroons`,
        `--macaroon-location=${config.polar.path}${config.proxy["macaroon-location"]}`,
        `--tls-location=${config.polar.path}${config.proxy["tls-location"]}`,
        `--admin-pubkey=${config.dave.pubkey}`,
        `--admin-token=${config.proxy["admin-token"]}`
    ]
}

go_nodes.forEach(n=> {
    const command = './sphinx-'+n.name
    const args = cliArgs[n.name] || []
    const options = {cwd: '../sphinx-'+n.name}
    if(config[n.name]) options.env = config[n.name]
    run_script(command, args, n.name, n.color, options, function(exit_code){
        console.log("quit ", n.name, exit_code)
    })
})

relay_nodes.forEach(n => {
    console.log(chalk[n.color](n.name))

    const configText = `--config=${config.path}sphinx-relay/testing/cluster/${n.name}.json`
    const dbText = `--db=${config.path}sphinx-relay/testing/cluster/${n.name}-db.json`
    const options = {
        env: process.env
    }

    options.env.MACAROON_LOCATION = `${config.polar.path}${n.name}/data/chain/bitcoin/regtest/admin.macaroon`
    options.env.TLS_LOCATION = `${config.polar.path}${n.name}/tls.cert`

    if(n.name === "dave"){
        options.env.PROXY_MACAROONS_DIR = `${config.path}sphinx-proxy/macaroons`,
        options.env.PROXY_TLS_LOCATION = `${config.path}sphinx-proxy/cert/tls.cert`,
        options.env.PROXY_ADMIN_TOKEN = config.proxy["admin-token"]
    }
    
    run_script("node", ["./dist/app.js", configText, dbText], n.name, n.color, {}, function(exit_code) {
        console.log('quit relay: ' + exit_code);
    });
}) 

// This function will output the lines from the script 
// AS is runs, AND will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command, args, name, color, options, callback) {

    if(isOnly&&!only.includes(name)) return
    if(skip.includes(name))return

    console.log("Starting Process.", color);
    

    var child = child_process.spawn(command, args, options);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        console.log(chalk[color](data));
        srv.setLog(name, data)
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
        srv.setError(name, data)
    });

    child.on('close', function(code) {
        srv.setError(name, 'PROCESS QUIT: '+code)
        callback(code);
    });
}