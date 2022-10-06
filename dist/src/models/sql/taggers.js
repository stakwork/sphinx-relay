"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let Tagger = class Tagger extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], Tagger.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Tagger.prototype, "pubkey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Tagger.prototype, "tenant", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Tagger.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DECIMAL),
    __metadata("design:type", Number)
], Tagger.prototype, "amount", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Tagger.prototype, "refId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Tagger.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Tagger.prototype, "timestamp", void 0);
Tagger = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_tagger', underscored: true })
], Tagger);
exports.default = Tagger;
//# sourceMappingURL=taggers.js.map