import { DMMF } from '@prisma/generator-helper';
export declare function checkModelHasModelRelation(model: DMMF.Model): boolean;
export declare function checkModelHasManyModelRelation(model: DMMF.Model): boolean;
export declare function checkIsModelRelationField(modelField: DMMF.Field): boolean;
export declare function checkIsManyModelRelationField(modelField: DMMF.Field): boolean;
export declare function findModelByName(models: DMMF.Model[], modelName: string): DMMF.Model | undefined;
