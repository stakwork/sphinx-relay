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
let LocalData = class LocalData extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], LocalData.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], LocalData.prototype, "boost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], LocalData.prototype, "date", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], LocalData.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "episodeTitle", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "guest", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "imageUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], LocalData.prototype, "keyword", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "link", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "nodeType", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "refId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "showTitle", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], LocalData.prototype, "text", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "timestamp", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "topics", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], LocalData.prototype, "weight", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], LocalData.prototype, "firstInteraction", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], LocalData.prototype, "history", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 1,
    }),
    __metadata("design:type", Number)
], LocalData.prototype, "searchFrequency", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], LocalData.prototype, "tenant", void 0);
LocalData = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_local_data', underscored: true })
], LocalData);
exports.default = LocalData;
//# sourceMappingURL=localData.js.map