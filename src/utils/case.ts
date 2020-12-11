import * as changeCase from "change-case";

const dateKeys = ['date', 'createdAt', 'updatedAt', 'created_at', 'updated_at']
const boolKeys = ['fromGroup', 'isOwner', 'deleted']

function toSnake(obj) {
    const ret: { [k: string]: any } = {}
    for (let [key, value] of Object.entries(obj)) {
        if (dateKeys.includes(key) && value) {
            const v: any = value
            let d = new Date(v)
            if (isNaN(d.getTime())) d = new Date()
            ret[changeCase.snakeCase(key)] = d.toISOString()
        } else if (boolKeys.includes(key)) {
            ret[changeCase.snakeCase(key)] = (!value || value === '0') ? 0 : 1
        } else {
            ret[changeCase.snakeCase(key)] = value
        }
    }
    return ret
}

function toCamel(obj) {
    const ret: { [k: string]: any } = {}
    for (let [key, value] of Object.entries(obj)) {
        ret[changeCase.camelCase(key)] = value
    }
    return ret
}

export { toSnake, toCamel }