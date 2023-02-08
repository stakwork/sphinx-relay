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
let CallRecording = class CallRecording extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], CallRecording.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], CallRecording.prototype, "recordingId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], CallRecording.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], CallRecording.prototype, "fileName", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], CallRecording.prototype, "participants", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], CallRecording.prototype, "callLength", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], CallRecording.prototype, "chatId", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], CallRecording.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], CallRecording.prototype, "retry", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], CallRecording.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], CallRecording.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], CallRecording.prototype, "stakworkProjectId", void 0);
CallRecording = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sphinx_call_recording', underscored: true })
], CallRecording);
exports.default = CallRecording;
//# sourceMappingURL=callRecording.js.map