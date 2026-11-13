"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const constants_1 = require("../configs/constants");
// Hash password
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, constants_1.constants.saltRounds);
};
exports.hashPassword = hashPassword;
// Verify password
const verifyPassword = async (password, passwordHash) => {
    return await bcrypt_1.default.compare(password, passwordHash);
};
exports.verifyPassword = verifyPassword;
