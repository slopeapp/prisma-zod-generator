"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongodbRawOp = void 0;
const isMongodbRawOp = (name) => /find([^]*?)Raw/.test(name) || /aggregate([^]*?)Raw/.test(name);
exports.isMongodbRawOp = isMongodbRawOp;
//# sourceMappingURL=helpers.js.map