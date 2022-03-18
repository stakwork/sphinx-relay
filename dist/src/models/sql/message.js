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
let Message = class Message extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], Message.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "uuid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "chatId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "sender", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "receiver", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DECIMAL),
    __metadata("design:type", Number)
], Message.prototype, "amount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DECIMAL),
    __metadata("design:type", Number)
], Message.prototype, "amountMsat", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "paymentHash", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "paymentRequest", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Message.prototype, "date", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Message.prototype, "expirationDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "messageContent", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "remoteMessageContent", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "statusMap", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "parentId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Message.prototype, "subscriptionId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "mediaKey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "mediaType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "mediaToken", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    }),
    __metadata("design:type", Boolean)
], Message.prototype, "seen", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "senderAlias", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Message.prototype, "senderPic", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "originalMuid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Message.prototype, "replyUuid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], Message.prototype, "network_type", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Message.prototype, "tenant", void 0);
Message = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_messages', underscored: true })
], Message);
exports.default = Message;
//# sourceMappingURL=message.js.map