"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_1 = require("../../utils/case");
describe('tests for src/utils/case', () => {
    const notSnakeObj = {
        superCamelCase: 20,
        nextValueHere: 'words',
    };
    const correct_snaked_string = {
        super_camel_case: 20,
        next_value_here: 'words',
    };
    test('toSnake', () => __awaiter(void 0, void 0, void 0, function* () {
        const snaked_string = case_1.toSnake(notSnakeObj);
        expect(snaked_string).toStrictEqual(correct_snaked_string);
    }));
    test('toCamel', () => __awaiter(void 0, void 0, void 0, function* () {
        const camel_string = case_1.toCamel(correct_snaked_string);
        expect(camel_string).toStrictEqual(notSnakeObj);
    }));
});
//# sourceMappingURL=case.test.js.map