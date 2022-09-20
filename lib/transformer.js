"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const helpers_1 = require("./helpers");
const writeFileSafely_1 = require("./utils/writeFileSafely");
class Transformer {
    constructor(params) {
        var _a, _b, _c, _d;
        this.schemaImports = new Set();
        this.hasJson = false;
        this.name = (_a = params.name) !== null && _a !== void 0 ? _a : '';
        this.fields = (_b = params.fields) !== null && _b !== void 0 ? _b : [];
        this.modelOperations = (_c = params.modelOperations) !== null && _c !== void 0 ? _c : [];
        this.enumTypes = (_d = params.enumTypes) !== null && _d !== void 0 ? _d : [];
    }
    static setOutputPath(outPath) {
        this.outputPath = outPath;
    }
    static getOutputPath() {
        return this.outputPath;
    }
    addSchemaImport(name) {
        this.schemaImports.add(name);
    }
    getAllSchemaImports() {
        return [...this.schemaImports]
            .map((name) => Transformer.enumNames.includes(name)
            ? `import { ${name}Schema } from '../enums/${name}.schema';`
            : `import { ${name}ObjectSchema } from './${name}.schema';`)
            .join(';\r\n');
    }
    getPrismaStringLine(field, inputType, inputsLength) {
        const isEnum = inputType.location === 'enumTypes';
        let objectSchemaLine = `${inputType.type}ObjectSchema`;
        let enumSchemaLine = `${inputType.type}Schema`;
        const schema = inputType.type === this.name
            ? objectSchemaLine
            : isEnum
                ? enumSchemaLine
                : objectSchemaLine;
        const arr = inputType.isList ? '.array()' : '';
        const opt = !field.isRequired ? '.optional()' : '';
        return inputsLength === 1
            ? `  ${field.name}: z.lazy(() => ${schema})${arr}${opt}`
            : `z.lazy(() => ${schema})${arr}${opt}`;
    }
    wrapWithZodValidators(mainValidator, field, inputType) {
        let line = '';
        line = mainValidator;
        if (inputType.isList) {
            line += '.array()';
        }
        if (!field.isRequired) {
            line += '.optional()';
        }
        return line;
    }
    getObjectSchemaLine(field) {
        let lines = field.inputTypes;
        if (lines.length === 0) {
            return [];
        }
        let alternatives = lines.reduce((result, inputType) => {
            if (inputType.type === 'String') {
                result.push(this.wrapWithZodValidators('z.string()', field, inputType));
            }
            else if (inputType.type === 'Int' ||
                inputType.type === 'Float' ||
                inputType.type === 'Decimal') {
                result.push(this.wrapWithZodValidators('z.number()', field, inputType));
            }
            else if (inputType.type === 'BigInt') {
                result.push(this.wrapWithZodValidators('z.bigint()', field, inputType));
            }
            else if (inputType.type === 'Boolean') {
                result.push(this.wrapWithZodValidators('z.boolean()', field, inputType));
            }
            else if (inputType.type === 'DateTime') {
                result.push(this.wrapWithZodValidators('z.date()', field, inputType));
            }
            else if (inputType.type === 'Json') {
                this.hasJson = true;
                result.push(this.wrapWithZodValidators('jsonSchema', field, inputType));
            }
            else {
                const isEnum = inputType.location === 'enumTypes';
                if (inputType.namespace === 'prisma' || isEnum) {
                    if (inputType.type !== this.name &&
                        typeof inputType.type === 'string') {
                        this.addSchemaImport(inputType.type);
                    }
                    result.push(this.getPrismaStringLine(field, inputType, lines.length));
                }
            }
            return result;
        }, []);
        if (alternatives.length === 0) {
            return [];
        }
        if (alternatives.length > 1) {
            alternatives = alternatives.map((alter) => alter.replace('.optional()', ''));
        }
        const fieldName = alternatives.some((alt) => alt.includes(':'))
            ? ''
            : `  ${field.name}:`;
        const opt = !field.isRequired ? '.optional()' : '';
        let resString = alternatives.length === 1
            ? alternatives.join(',\r\n')
            : `z.union([${alternatives.join(',\r\n')}])${opt}`;
        if (field.isNullable) {
            resString += '.nullable()';
        }
        return [[`  ${fieldName} ${resString} `, field, true]];
    }
    getFieldValidators(zodStringWithMainType, field) {
        const { isRequired, isNullable } = field;
        if (!isRequired) {
            zodStringWithMainType += '.optional()';
        }
        if (isNullable) {
            zodStringWithMainType += '.nullable()';
        }
        return zodStringWithMainType;
    }
    getImportZod() {
        let zodImportStatement = "import { z } from 'zod';";
        zodImportStatement += '\n';
        return zodImportStatement;
    }
    getImportPrisma() {
        var _a;
        let prismaClientPath = '@prisma/client';
        if (Transformer.isDefaultPrismaClientOutput) {
            prismaClientPath = (_a = Transformer.prismaClientOutputPath) !== null && _a !== void 0 ? _a : '';
            prismaClientPath = path_1.default
                .relative(path_1.default.join(Transformer.outputPath, 'schemas', 'objects'), prismaClientPath)
                .split(path_1.default.sep)
                .join(path_1.default.posix.sep);
        }
        return `import type { Prisma } from '${prismaClientPath}';\n\n`;
    }
    getJsonSchemaImplementation() {
        let jsonSchemaImplementation = '';
        if (this.hasJson) {
            jsonSchemaImplementation += `\n`;
            jsonSchemaImplementation += `const literalSchema = z.union([z.string(), z.number(), z.boolean()]);\n`;
            jsonSchemaImplementation += `const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>\n`;
            jsonSchemaImplementation += `  z.union([literalSchema, z.array(jsonSchema.nullable()), z.record(jsonSchema.nullable())])\n`;
            jsonSchemaImplementation += `);\n\n`;
        }
        return jsonSchemaImplementation;
    }
    getImportsForObjectSchemas() {
        let imports = this.getImportZod();
        imports += this.getAllSchemaImports();
        imports += '\n\n';
        return imports;
    }
    getImportsForSchemas(additionalImports) {
        let imports = this.getImportZod();
        imports += [...additionalImports].join(';\r\n');
        imports += '\n\n';
        return imports;
    }
    addExportObjectSchema(schema) {
        let name = this.name;
        let exportName = this.name;
        if (Transformer.provider === 'mongodb') {
            if ((0, helpers_1.isMongodbRawOp)(name)) {
                name = Transformer.rawOpsMap[name];
                exportName = name.replace('Args', '');
            }
        }
        const end = `export const ${exportName}ObjectSchema = Schema`;
        return `const Schema: z.ZodType<Prisma.${name}> = ${schema};\n\n ${end}`;
    }
    addExportSchema(schema, name) {
        return `export const ${name}Schema = ${schema}`;
    }
    wrapWithZodObject(zodStringFields) {
        let wrapped = '';
        wrapped += 'z.object({';
        wrapped += '\n';
        wrapped += '  ' + zodStringFields;
        wrapped += '\n';
        wrapped += '})';
        return wrapped;
    }
    wrapWithZodOUnion(zodStringFields) {
        let wrapped = '';
        wrapped += 'z.union([';
        wrapped += '\n';
        wrapped += '  ' + zodStringFields.join(',');
        wrapped += '\n';
        wrapped += '])';
        return wrapped;
    }
    addFinalWrappers({ zodStringFields }) {
        const fields = [...zodStringFields];
        const shouldWrapWithUnion = fields.some((field) => 
        // TODO handle other cases if any
        // field.includes('create:') ||
        field.includes('connectOrCreate:') || field.includes('connect:'));
        if (!shouldWrapWithUnion) {
            return this.wrapWithZodObject(fields) + '.strict()';
        }
        const wrapped = fields.map((field) => this.wrapWithZodObject(field) + '.strict()');
        return this.wrapWithZodOUnion(wrapped);
    }
    getFinalForm(zodStringFields) {
        const objectSchema = `${this.addExportObjectSchema(this.addFinalWrappers({ zodStringFields }))}\n`;
        const prismaImport = this.getImportPrisma();
        const json = this.getJsonSchemaImplementation();
        return `${this.getImportsForObjectSchemas()}${prismaImport}${json}${objectSchema}`;
    }
    async printObjectSchemas() {
        const zodStringFields = this.fields
            .map((field) => this.getObjectSchemaLine(field))
            .flatMap((item) => item)
            .map((item) => {
            const [zodStringWithMainType, field, skipValidators] = item;
            const value = skipValidators
                ? zodStringWithMainType
                : this.getFieldValidators(zodStringWithMainType, field);
            return value.trim();
        });
        let name = this.name;
        let exportName = this.name;
        if ((0, helpers_1.isMongodbRawOp)(name)) {
            name = Transformer.rawOpsMap[name];
            exportName = name.replace('Args', '');
        }
        await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/objects/${exportName}.schema.ts`), this.getFinalForm(zodStringFields));
    }
    async printModelSchemas() {
        for (const model of this.modelOperations) {
            const { model: modelName, findUnique, findFirst, findMany, 
            // @ts-ignore
            createOne, createMany, 
            // @ts-ignore
            deleteOne, 
            // @ts-ignore
            updateOne, deleteMany, updateMany, 
            // @ts-ignore
            upsertOne, aggregate, groupBy, } = model;
            if (findUnique) {
                const imports = [
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${findUnique}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereUniqueInputObjectSchema })`, `${modelName}FindUnique`)}`);
            }
            if (findFirst) {
                const imports = [
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                    `import { ${modelName}OrderByWithRelationInputObjectSchema } from './objects/${modelName}OrderByWithRelationInput.schema'`,
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                    `import { ${modelName}ScalarFieldEnumSchema } from './enums/${modelName}ScalarFieldEnum.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${findFirst}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereInputObjectSchema.optional(), orderBy: ${modelName}OrderByWithRelationInputObjectSchema.optional(), cursor: ${modelName}WhereUniqueInputObjectSchema.optional(), take: z.number().optional(), skip: z.number().optional(), distinct: z.array(${modelName}ScalarFieldEnumSchema).optional() })`, `${modelName}FindFirst`)}`);
            }
            if (findMany) {
                const imports = [
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                    `import { ${modelName}OrderByWithRelationInputObjectSchema } from './objects/${modelName}OrderByWithRelationInput.schema'`,
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                    `import { ${modelName}ScalarFieldEnumSchema } from './enums/${modelName}ScalarFieldEnum.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${findMany}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereInputObjectSchema.optional(), orderBy: ${modelName}OrderByWithRelationInputObjectSchema.optional(), cursor: ${modelName}WhereUniqueInputObjectSchema.optional(), take: z.number().optional(), skip: z.number().optional(), distinct: z.array(${modelName}ScalarFieldEnumSchema).optional()  })`, `${modelName}FindMany`)}`);
            }
            if (createOne) {
                const imports = [
                    `import { ${modelName}CreateInputObjectSchema } from './objects/${modelName}CreateInput.schema'`,
                    `import { ${modelName}UncheckedCreateInputObjectSchema } from './objects/${modelName}UncheckedCreateInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${createOne}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema([
                    `z.object({`,
                    `  data: z.union([`,
                    `    ${modelName}CreateInputObjectSchema,`,
                    `    ${modelName}UncheckedCreateInputObjectSchema`,
                    `  ])`,
                    `})`,
                ].join('\n'), `${modelName}CreateOne`)}`);
            }
            if (createMany) {
                const imports = [
                    `import { ${modelName}CreateManyInputObjectSchema } from './objects/${modelName}CreateManyInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${createMany}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ data: ${modelName}CreateManyInputObjectSchema  })`, `${modelName}CreateMany`)}`);
            }
            if (deleteOne) {
                const imports = [
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${deleteOne}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereUniqueInputObjectSchema  })`, `${modelName}DeleteOne`)}`);
            }
            if (deleteMany) {
                const imports = [
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${deleteMany}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereInputObjectSchema.optional()  })`, `${modelName}DeleteMany`)}`);
            }
            if (updateOne) {
                const imports = [
                    `import { ${modelName}UpdateInputObjectSchema } from './objects/${modelName}UpdateInput.schema'`,
                    `import { ${modelName}UncheckedUpdateInputObjectSchema } from './objects/${modelName}UncheckedUpdateInput.schema'`,
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${updateOne}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema([
                    `z.object({ `,
                    `  data: z.union([`,
                    `    ${modelName}UpdateInputObjectSchema,`,
                    `    ${modelName}UncheckedUpdateInputObjectSchema`,
                    `  ]),`,
                    `  where: ${modelName}WhereUniqueInputObjectSchema`,
                    `})`,
                ].join('\n'), `${modelName}UpdateOne`)}`);
            }
            if (updateMany) {
                const imports = [
                    `import { ${modelName}UpdateManyMutationInputObjectSchema } from './objects/${modelName}UpdateManyMutationInput.schema'`,
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${updateMany}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ data: ${modelName}UpdateManyMutationInputObjectSchema, where: ${modelName}WhereInputObjectSchema.optional()  })`, `${modelName}UpdateMany`)}`);
            }
            if (upsertOne) {
                const imports = [
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                    `import { ${modelName}CreateInputObjectSchema } from './objects/${modelName}CreateInput.schema'`,
                    `import { ${modelName}UpdateInputObjectSchema } from './objects/${modelName}UpdateInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${upsertOne}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereUniqueInputObjectSchema, create: ${modelName}CreateInputObjectSchema, update: ${modelName}UpdateInputObjectSchema  })`, `${modelName}Upsert`)}`);
            }
            if (aggregate) {
                const imports = [
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                    `import { ${modelName}OrderByWithRelationInputObjectSchema } from './objects/${modelName}OrderByWithRelationInput.schema'`,
                    `import { ${modelName}WhereUniqueInputObjectSchema } from './objects/${modelName}WhereUniqueInput.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${aggregate}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereInputObjectSchema.optional(), orderBy: ${modelName}OrderByWithRelationInputObjectSchema.optional(), cursor: ${modelName}WhereUniqueInputObjectSchema.optional(), take: z.number().optional(), skip: z.number().optional()  })`, `${modelName}Aggregate`)}`);
            }
            if (groupBy) {
                const imports = [
                    `import { ${modelName}WhereInputObjectSchema } from './objects/${modelName}WhereInput.schema'`,
                    `import { ${modelName}OrderByWithAggregationInputObjectSchema } from './objects/${modelName}OrderByWithAggregationInput.schema'`,
                    `import { ${modelName}ScalarWhereWithAggregatesInputObjectSchema } from './objects/${modelName}ScalarWhereWithAggregatesInput.schema'`,
                    `import { ${modelName}ScalarFieldEnumSchema } from './enums/${modelName}ScalarFieldEnum.schema'`,
                ];
                await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/${groupBy}.schema.ts`), `${this.getImportsForSchemas(imports)}${this.addExportSchema(`z.object({ where: ${modelName}WhereInputObjectSchema.optional(), orderBy: ${modelName}OrderByWithAggregationInputObjectSchema, having: ${modelName}ScalarWhereWithAggregatesInputObjectSchema.optional(), take: z.number().optional(), skip: z.number().optional(), by: z.array(${modelName}ScalarFieldEnumSchema)  })`, `${modelName}GroupBy`)}`);
            }
        }
    }
    async printEnumSchemas() {
        for (const enumType of this.enumTypes) {
            const { name, values } = enumType;
            const enumContents = `z.enum(${JSON.stringify(values)})`;
            const schemaContents = name.match(/^Nullable/)
                ? `z.nullable(${enumContents})`
                : enumContents;
            const result = `${this.getImportZod()}\n${this.addExportSchema(schemaContents, `${name}`)}`;
            await (0, writeFileSafely_1.writeFileSafely)(path_1.default.join(Transformer.outputPath, `schemas/enums/${name}.schema.ts`), result);
        }
    }
}
exports.default = Transformer;
Transformer.enumNames = [];
Transformer.rawOpsMap = {};
Transformer.outputPath = './generated';
//# sourceMappingURL=transformer.js.map