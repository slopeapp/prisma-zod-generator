"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const internals_1 = require("@prisma/internals");
const fs_1 = require("fs");
const transformer_1 = __importDefault(require("./transformer"));
const removeDir_1 = __importDefault(require("./utils/removeDir"));
async function generate(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const outputDir = (0, internals_1.parseEnvValue)(options.generator.output);
    await fs_1.promises.mkdir(outputDir, { recursive: true });
    await (0, removeDir_1.default)(outputDir, true);
    const prismaClientProvider = options.otherGenerators.find((it) => (0, internals_1.parseEnvValue)(it.provider) === 'prisma-client-js');
    const prismaClientDmmf = await (0, internals_1.getDMMF)({
        datamodel: options.datamodel,
        previewFeatures: prismaClientProvider === null || prismaClientProvider === void 0 ? void 0 : prismaClientProvider.previewFeatures,
    });
    const dataSource = (_a = options.datasources) === null || _a === void 0 ? void 0 : _a[0];
    transformer_1.default.isDefaultPrismaClientOutput =
        (_b = prismaClientProvider === null || prismaClientProvider === void 0 ? void 0 : prismaClientProvider.isCustomOutput) !== null && _b !== void 0 ? _b : false;
    if (prismaClientProvider === null || prismaClientProvider === void 0 ? void 0 : prismaClientProvider.isCustomOutput) {
        transformer_1.default.prismaClientOutputPath =
            (_d = (_c = prismaClientProvider === null || prismaClientProvider === void 0 ? void 0 : prismaClientProvider.output) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : '';
    }
    transformer_1.default.setOutputPath(outputDir);
    const enumTypes = [
        ...prismaClientDmmf.schema.enumTypes.prisma,
        ...((_e = prismaClientDmmf.schema.enumTypes.model) !== null && _e !== void 0 ? _e : []),
    ];
    const enumNames = enumTypes.map((enumItem) => enumItem.name);
    transformer_1.default.enumNames = enumNames !== null && enumNames !== void 0 ? enumNames : [];
    const enumsObj = new transformer_1.default({
        enumTypes,
    });
    await enumsObj.printEnumSchemas();
    const inputObjectTypes = prismaClientDmmf.schema.inputObjectTypes.prisma;
    const rawOpsMap = {};
    /*
    TODO: remove once Prisma fix this issue: https://github.com/prisma/prisma/issues/14900
    */
    if (dataSource.provider === 'mongodb') {
        const modelNames = prismaClientDmmf.mappings.modelOperations.map((item) => item.model);
        const rawOpsNames = [
            ...new Set(prismaClientDmmf.mappings.modelOperations.reduce((result, current) => {
                const keys = Object.keys(current);
                keys === null || keys === void 0 ? void 0 : keys.forEach((key) => {
                    if (key.includes('Raw')) {
                        result.push(key);
                    }
                });
                return result;
            }, [])),
        ];
        rawOpsNames.forEach((opName) => {
            modelNames.forEach((modelName) => {
                const isFind = opName === 'findRaw';
                const opWithModel = `${opName.replace('Raw', '')}${modelName}Raw`;
                rawOpsMap[opWithModel] = isFind
                    ? `${modelName}FindRawArgs`
                    : `${modelName}AggregateRawArgs`;
            });
        });
        transformer_1.default.rawOpsMap = rawOpsMap !== null && rawOpsMap !== void 0 ? rawOpsMap : {};
        const queryOutputTypes = prismaClientDmmf.schema.outputObjectTypes.prisma.filter((item) => item.name === 'Query');
        const mongodbRawQueries = (_f = queryOutputTypes === null || queryOutputTypes === void 0 ? void 0 : queryOutputTypes[0].fields.filter((field) => field.name.includes('Raw'))) !== null && _f !== void 0 ? _f : [];
        mongodbRawQueries.forEach((item) => {
            inputObjectTypes.push({
                name: item.name,
                constraints: {
                    maxNumFields: null,
                    minNumFields: null,
                },
                fields: item.args.map((arg) => ({
                    name: arg.name,
                    isRequired: arg.isRequired,
                    isNullable: arg.isNullable,
                    inputTypes: arg.inputTypes,
                })),
            });
        });
    }
    transformer_1.default.provider = dataSource.provider;
    for (let i = 0; i < inputObjectTypes.length; i += 1) {
        const fields = (_g = inputObjectTypes[i]) === null || _g === void 0 ? void 0 : _g.fields;
        const name = (_h = inputObjectTypes[i]) === null || _h === void 0 ? void 0 : _h.name;
        const obj = new transformer_1.default({ name, fields });
        await obj.printObjectSchemas();
    }
    const obj = new transformer_1.default({
        modelOperations: prismaClientDmmf.mappings.modelOperations,
    });
    await obj.printModelSchemas();
}
exports.generate = generate;
//# sourceMappingURL=prisma-generator.js.map