export interface ModelMetadata {
    format: 'step' | 'stp' | 'glb' | 'gltf';
    isValid: boolean;
    fileSizeBytes: number;
    partCount?: number;
    meshCount?: number;
    schemaVersion?: string;
    hasConvertedGlb: boolean;
    convertedGlbPath?: string;
}
export declare class ModelConverterService {
    private readonly logger;
    private occtInstance;
    onModuleInit(): Promise<void>;
    inspect3DModel(filePath: string): Promise<ModelMetadata>;
    convertStepToGlb(stepFilePath: string, outputGlbPath: string): Promise<{
        success: boolean;
        outputGlbPath?: string;
        error?: string;
    }>;
}
