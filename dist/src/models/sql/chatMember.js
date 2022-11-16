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
let ChatMember = class ChatMember extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "contactId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "role", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "totalSpent", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "totalMessages", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], ChatMember.prototype, "lastActive", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ChatMember.prototype, "lastAlias", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "tenant", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "totalEarned", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ChatMember.prototype, "reputation", void 0);
ChatMember = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'sphinx_chat_members',
        underscored: true,
        indexes: [{ unique: true, fields: ['chat_id', 'contact_id'] }],
    })
], ChatMember);
exports.default = ChatMember;
//# sourceMappingURL=chatMember.js.map