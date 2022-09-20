import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { TransformerParams } from './types';
export default class Transformer {
    name: string;
    fields: PrismaDMMF.SchemaArg[];
    schemaImports: Set<string>;
    modelOperations: PrismaDMMF.ModelMapping[];
    enumTypes: PrismaDMMF.SchemaEnum[];
    static enumNames: string[];
    static rawOpsMap: {
        [name: string]: string;
    };
    static provider: string;
    private static outputPath;
    private hasJson;
    static isDefaultPrismaClientOutput?: boolean;
    static prismaClientOutputPath?: string;
    constructor(params: TransformerParams);
    static setOutputPath(outPath: string): void;
    static getOutputPath(): string;
    addSchemaImport(name: string): void;
    getAllSchemaImports(): string;
    getPrismaStringLine(field: PrismaDMMF.SchemaArg, inputType: PrismaDMMF.SchemaArgInputType, inputsLength: number): string;
    wrapWithZodValidators(mainValidator: string, field: PrismaDMMF.SchemaArg, inputType: PrismaDMMF.SchemaArgInputType): string;
    getObjectSchemaLine(field: PrismaDMMF.SchemaArg): [string, PrismaDMMF.SchemaArg, boolean][];
    getFieldValidators(zodStringWithMainType: string, field: PrismaDMMF.SchemaArg): string;
    getImportZod(): string;
    getImportPrisma(): string;
    getJsonSchemaImplementation(): string;
    getImportsForObjectSchemas(): string;
    getImportsForSchemas(additionalImports: string[]): string;
    addExportObjectSchema(schema: string): string;
    addExportSchema(schema: string, name: string): string;
    wrapWithZodObject(zodStringFields: string | string[]): string;
    wrapWithZodOUnion(zodStringFields: string[]): string;
    addFinalWrappers({ zodStringFields }: {
        zodStringFields: string[];
    }): string;
    getFinalForm(zodStringFields: string[]): string;
    printObjectSchemas(): Promise<void>;
    printModelSchemas(): Promise<void>;
    printEnumSchemas(): Promise<void>;
}
