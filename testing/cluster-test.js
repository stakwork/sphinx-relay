var child_process = require('child_process');
const chalk = require('chalk');
const config = require('./cluster_config.json')

console.log("Node Version: ", process.version);

const nodes = [
    {name: "alice", color: "blue"},
    {name: "bob", color: "red"},
    {name: "carol", color: "green"},
    {name: "dave", color: "magenta"}
]

const proxyArgs = [
    `--tlscertpath=${config.path}sphinx-proxy/cert/tls.cert`,
    `--tlskeypath=${config.path}sphinx-proxy/cert/tls.key`,
    `--server-macaroons-dir=${config.path}sphinx-proxy/macaroons`,
    `--macaroon-location=${config.polar.path}${config.proxy["macaroon-location"]}`,
    `--tls-location=${config.polar.path}${config.proxy["tls-location"]}`,
    `--admin-pubkey=${config.dave.pubkey}`,
    `--admin-token=${config.proxy["admin-token"]}`
]

run_script("./sphinx-proxy", proxyArgs, "bgBlue", {cwd: "../sphinx-proxy"}, function(exit_code){
    console.log("connecting Proxy")
})

run_script("./sphinx-auth", [], "bgGreen", {cwd: "../sphinx-auth", env: config.auth}, function(exit_code){
    console.log("connecting Auth")
})

run_script("./sphinx-mqtt", [], "bgMagenta", {cwd: "../sphinx-mqtt"}, function(exit_code){
    console.log("connecting Proxy")
})

run_script("./sphinx-tribes", [], "bgCyan", {cwd: "../sphinx-tribes", env: config.tribes}, function(exit_code){
    console.log("connecting Proxy")
})

run_script("./sphinx-meme", [], "bgYellow", {cwd: "../sphinx-meme", env: config.meme}, function(exit_code){
    console.log("connecting Proxy")
})


nodes.forEach(n => {
    console.log(chalk[n.color](n.name))

    const configText = `--config=${config.path}sphinx-relay/testing/cluster/${n.name}.json`
    const dbText = `--db=${config.path}sphinx-relay/testing/cluster/${n.name}-db.json`
    const color = n.color
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

    console.log("OPTIONS === ", options)
    
    run_script("node", ["./dist/app.js", configText, dbText], color, {}, function(exit_code) {
        console.log("Process Finished.");
        console.log('closing code: ' + exit_code);
    });


}) 

console.log ("Continuing to do node things while the process runs at the same time...");

// This function will output the lines from the script 
// AS is runs, AND will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command, args, color, options, callback) {
    console.log("Starting Process.");

    var child = child_process.spawn(command, args, options);


    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        console.log(chalk[color](data));
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
    });

    child.on('close', function(code) {
        callback(code);
    });
}