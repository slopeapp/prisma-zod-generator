import { DMMF as PrismaDMMF } from '@prisma/client/runtime';
export declare type TransformerParams = {
    enumTypes?: PrismaDMMF.SchemaEnum[];
    fields?: PrismaDMMF.SchemaArg[];
    name?: string;
    modelOperations?: PrismaDMMF.ModelMapping[];
    isDefaultPrismaClientOutput?: boolean;
    prismaClientOutputPath?: string;
};
