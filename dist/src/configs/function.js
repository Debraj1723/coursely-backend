"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
// Read YAML configuration
const readYaml = (filePath) => {
    const fullPath = path_1.default.resolve(process.cwd(), filePath);
    const fileContent = fs_1.default.readFileSync(fullPath, "utf8");
    return js_yaml_1.default.load(fileContent) || {};
};
// Load API configurations
const auth = readYaml("src/ymls/apis/auth.yml");
const course = readYaml("src/ymls/apis/course.yml");
const registration = readYaml("src/ymls/apis/registration.yml");
// Combine all Lambda configurations
const functions = {
    ...auth,
    ...course,
    ...registration
};
exports.default = functions;
