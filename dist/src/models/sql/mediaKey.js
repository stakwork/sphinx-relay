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
Used for media uploads. When you upload a file,
also upload the symetric key encrypted for each chat member.
When they buy the file, they can retrieve the key from here.

"received" media keys are not stored here, only in Message
*/
let MediaKey = class MediaKey extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], MediaKey.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], MediaKey.prototype, "muid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], MediaKey.prototype, "chatId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], MediaKey.prototype, "receiver", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], MediaKey.prototype, "key", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], MediaKey.prototype, "messageId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], MediaKey.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], MediaKey.prototype, "mediaType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], MediaKey.prototype, "sender", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], MediaKey.prototype, "originalMuid", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], MediaKey.prototype, "tenant", void 0);
MediaKey = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_media_keys', underscored: true })
], MediaKey);
exports.default = MediaKey;
//# sourceMappingURL=mediaKey.js.map