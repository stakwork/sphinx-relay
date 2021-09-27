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
let Contact = class Contact extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], Contact.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "routeHint", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "publicKey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "nodeAlias", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "alias", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "photoUrl", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Contact.prototype, "privatePhoto", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Contact.prototype, "isOwner", void 0);
__decorate([
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    }),
    __metadata("design:type", Boolean)
], Contact.prototype, "deleted", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "authToken", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Contact.prototype, "remoteId", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Contact.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Contact.prototype, "contactKey", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "deviceId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Contact.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Contact.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Contact.prototype, "fromGroup", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], Contact.prototype, "notificationSound", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], Contact.prototype, "lastActive", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Contact.prototype, "tipAmount", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Contact.prototype, "tenant", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Contact.prototype, "priceToMeet", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Contact.prototype, "unmet", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], Contact.prototype, "blocked", void 0);
Contact = __decorate([
    sequelize_typescript_1.Table({ tableName: 'sphinx_contacts', underscored: true })
], Contact);
exports.default = Contact;
//# sourceMappingURL=contact.js.map