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
let ContentFeedStatus = class ContentFeedStatus extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], ContentFeedStatus.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ContentFeedStatus.prototype, "feedId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ContentFeedStatus.prototype, "feedUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], ContentFeedStatus.prototype, "subscriptionStatus", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ContentFeedStatus.prototype, "itemId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], ContentFeedStatus.prototype, "episodesStatus", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ContentFeedStatus.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ContentFeedStatus.prototype, "satsPerMinute", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.REAL),
    __metadata("design:type", Number)
], ContentFeedStatus.prototype, "playerSpeed", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ContentFeedStatus.prototype, "tenant", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], ContentFeedStatus.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], ContentFeedStatus.prototype, "updatedAt", void 0);
ContentFeedStatus = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_content_feed_status', underscored: true })
], ContentFeedStatus);
exports.default = ContentFeedStatus;
//# sourceMappingURL=contentFeedStatus.js.map