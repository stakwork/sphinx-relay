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
let Subscription = class Subscription extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    }),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Subscription.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Subscription.prototype, "contactId", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Subscription.prototype, "cron", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DECIMAL),
    __metadata("design:type", Number)
], Subscription.prototype, "amount", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DECIMAL),
    __metadata("design:type", Number)
], Subscription.prototype, "totalPaid", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Subscription.prototype, "endNumber", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Subscription.prototype, "endDate", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Subscription.prototype, "count", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Subscription.prototype, "ended", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Subscription.prototype, "paused", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Subscription.prototype, "updatedAt", void 0);
Subscription = __decorate([
    sequelize_typescript_1.Table({ tableName: 'sphinx_subscriptions', underscored: true })
], Subscription);
exports.default = Subscription;
//# sourceMappingURL=subscription.js.map