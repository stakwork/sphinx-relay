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
let Lsat = class Lsat extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], Lsat.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
    }),
    __metadata("design:type", String)
], Lsat.prototype, "identifier", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Lsat.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Lsat.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "macaroon", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "paymentRequest", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "preimage", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "issuer", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "paths", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Lsat.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Lsat.prototype, "tenant", void 0);
Lsat = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'sphinx_lsats',
        underscored: true,
        indexes: [{ unique: true, fields: ['id', 'identifier'] }],
    })
], Lsat);
exports.default = Lsat;
//# sourceMappingURL=lsat.js.map