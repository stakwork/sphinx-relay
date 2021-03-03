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
let Chat = class Chat extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    }),
    __metadata("design:type", Number)
], Chat.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "uuid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "photoUrl", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Chat.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Chat.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "contactIds", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Chat.prototype, "isMuted", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Chat.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Chat.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }),
    __metadata("design:type", Boolean)
], Chat.prototype, "deleted", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Chat.prototype, "groupKey", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Chat.prototype, "groupPrivateKey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "host", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Chat.prototype, "priceToJoin", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Chat.prototype, "pricePerMessage", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Chat.prototype, "escrowAmount", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Chat.prototype, "escrowMillis", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], Chat.prototype, "unlisted", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Chat.prototype, "private", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "ownerPubkey", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }),
    __metadata("design:type", Boolean)
], Chat.prototype, "seen", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "appUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "feedUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "meta", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "myPhotoUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Chat.prototype, "myAlias", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Chat.prototype, "tenant", void 0);
Chat = __decorate([
    sequelize_typescript_1.Table({ tableName: 'sphinx_chats', underscored: true })
], Chat);
exports.default = Chat;
//# sourceMappingURL=chat.js.map