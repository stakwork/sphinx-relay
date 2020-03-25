import * as changeCase from "change-case";

const dateKeys = ['date','createdAt','updatedAt','created_at','updated_at']

function toSnake(obj) {
    const ret: {[k: string]: any} = {}
    for (let [key, value] of Object.entries(obj)) {
        if(dateKeys.includes(key) && value){
            const v: any = value
            const d = new Date(v)
            ret[changeCase.snakeCase(key)] = d.toISOString()
        } else {
            ret[changeCase.snakeCase(key)] = value
        }   
    }
    return ret
}

function toCamel(obj) {
    const ret: {[k: string]: any} = {}
    for (let [key, value] of Object.entries(obj)) {
        ret[changeCase.camelCase(key)] = value
    }
    return ret
}

export {toSnake, toCamel}