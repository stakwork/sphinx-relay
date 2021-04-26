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
BOT CREATOR - store the installers of your bot
*/
let BotMember = class BotMember extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    }),
    __metadata("design:type", Number)
], BotMember.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], BotMember.prototype, "botId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], BotMember.prototype, "memberPubkey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], BotMember.prototype, "tribeUuid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], BotMember.prototype, "msgCount", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], BotMember.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], BotMember.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], BotMember.prototype, "tenant", void 0);
BotMember = __decorate([
    sequelize_typescript_1.Table({ tableName: 'sphinx_bot_members', underscored: true })
], BotMember);
exports.default = BotMember;
//# sourceMappingURL=botMember.js.map