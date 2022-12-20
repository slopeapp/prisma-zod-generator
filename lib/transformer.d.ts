import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { AggregateOperationSupport, TransformerParams } from './types';
export default class Transformer {
    name: string;
    fields: PrismaDMMF.SchemaArg[];
    schemaImports: Set<string>;
    models: PrismaDMMF.Model[];
    modelOperations: PrismaDMMF.ModelMapping[];
    aggregateOperationSupport: AggregateOperationSupport;
    enumTypes: PrismaDMMF.SchemaEnum[];
    static enumNames: string[];
    static rawOpsMap: {
        [name: string]: string;
    };
    static provider: string;
    private static outputPath;
    private hasJson;
    private static prismaClientOutputPath;
    private static isCustomPrismaClientOutputPath;
    private static isGenerateSelect;
    private static isGenerateInclude;
    constructor(params: TransformerParams);
    static setOutputPath(outPath: string): void;
    static setIsGenerateSelect(isGenerateSelect: boolean): void;
    static setIsGenerateInclude(isGenerateInclude: boolean): void;
    static getOutputPath(): string;
    static setPrismaClientOutputPath(prismaClientCustomPath: string): void;
    generateEnumSchemas(): Promise<void>;
    generateImportZodStatement(): string;
    generateExportSchemaStatement(name: string, schema: string): string;
    generateObjectSchema(): Promise<void>;
    generateObjectSchemaFields(): string[];
    generateObjectSchemaField(field: PrismaDMMF.SchemaArg): [string, PrismaDMMF.SchemaArg, boolean][];
    wrapWithZodValidators(mainValidator: string, field: PrismaDMMF.SchemaArg, inputType: PrismaDMMF.SchemaArgInputType): string;
    addSchemaImport(name: string): void;
    generatePrismaStringLine(field: PrismaDMMF.SchemaArg, inputType: PrismaDMMF.SchemaArgInputType, inputsLength: number): string;
    generateFieldValidators(zodStringWithMainType: string, field: PrismaDMMF.SchemaArg): string;
    prepareObjectSchema(zodObjectSchemaFields: string[]): string;
    generateExportObjectSchemaStatement(schema: string): string;
    addFinalWrappers({ zodStringFields }: {
        zodStringFields: string[];
    }): string;
    generateImportPrismaStatement(): string;
    generateJsonSchemaImplementation(): string;
    generateObjectSchemaImportStatements(): string;
    generateSchemaImports(): string;
    checkIsModelQueryType(type: string): {
        isModelQueryType: boolean;
        modelName: string;
        queryName: string;
    } | {
        isModelQueryType: boolean;
        modelName?: undefined;
        queryName?: undefined;
    };
    resolveModelQuerySchemaName(modelName: string, queryName: string): string;
    wrapWithZodUnion(zodStringFields: string[]): string;
    wrapWithZodObject(zodStringFields: string | string[]): string;
    resolveObjectSchemaName(): string;
    generateModelSchemas(): Promise<void>;
    generateImportStatements(imports: (string | undefined)[]): string;
    resolveSelectIncludeImportAndZodSchemaLine(model: PrismaDMMF.Model): {
        selectImport: string;
        includeImport: string;
        selectZodSchemaLine: string;
        includeZodSchemaLine: string;
        selectZodSchemaLineLazy: string;
        includeZodSchemaLineLazy: string;
    };
}
