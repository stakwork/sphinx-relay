import './tv42_zbase32_gopherjs'

function encode(b){
    return global['zbase32'].Encode(b)
}
function decode(txt){
    return global['zbase32'].Decode(txt)
}
export {
    encode,
    decode,
}