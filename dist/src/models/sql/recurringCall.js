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
// id | Title | Desc | link | current_version_id | chatId | tenant | createdAt | updatedAt
let RecurringCall = class RecurringCall extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], RecurringCall.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], RecurringCall.prototype, "title", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], RecurringCall.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], RecurringCall.prototype, "link", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], RecurringCall.prototype, "currentVersionId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], RecurringCall.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], RecurringCall.prototype, "tenant", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], RecurringCall.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], RecurringCall.prototype, "updatedAt", void 0);
RecurringCall = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_recurring_calls', underscored: true })
], RecurringCall);
exports.default = RecurringCall;
//# sourceMappingURL=recurringCall.js.map