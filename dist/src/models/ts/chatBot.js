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
/*
TRIBE OWNER - bots installed as "contacts" in a tribe
*/
let ChatBot = class ChatBot extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    }),
    __metadata("design:type", Number)
], ChatBot.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatBot.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "botUuid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatBot.prototype, "botType", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "botPrefix", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "botMakerPubkey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "botMakerRouteHint", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "msgTypes", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatBot.prototype, "meta", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatBot.prototype, "pricePerUse", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], ChatBot.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], ChatBot.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatBot.prototype, "tenant", void 0);
ChatBot = __decorate([
    sequelize_typescript_1.Table({
        tableName: 'sphinx_chat_bots', underscored: true, indexes: [
            { unique: true, fields: ['chat_id', 'bot_uuid'] }
        ]
    })
], ChatBot);
exports.default = ChatBot;
//# sourceMappingURL=chatBot.js.map