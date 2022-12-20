import { DMMF, ConnectorType, Dictionary } from '@prisma/generator-helper';
interface AddMissingInputObjectTypeOptions {
    isGenerateSelect: boolean;
    isGenerateInclude: boolean;
}
export declare function addMissingInputObjectTypes(inputObjectTypes: DMMF.InputType[], outputObjectTypes: DMMF.OutputType[], models: DMMF.Model[], modelOperations: DMMF.ModelMapping[], dataSourceProvider: ConnectorType, options: AddMissingInputObjectTypeOptions): void;
export declare function resolveAddMissingInputObjectTypeOptions(generatorConfigOptions: Dictionary<string>): AddMissingInputObjectTypeOptions;
export {};
