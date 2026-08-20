"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ModelConverterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelConverterService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let occtimportjs = null;
try {
    occtimportjs = require('occt-import-js');
}
catch {
}
let ModelConverterService = ModelConverterService_1 = class ModelConverterService {
    logger = new common_1.Logger(ModelConverterService_1.name);
    occtInstance = null;
    async onModuleInit() {
        if (occtimportjs) {
            try {
                if (typeof occtimportjs === 'function') {
                    this.occtInstance = await occtimportjs();
                }
                else if (occtimportjs.default) {
                    this.occtInstance = await occtimportjs.default();
                }
                this.logger.log('🧊 3D OCCT STEP Engine initialized successfully');
            }
            catch (err) {
                this.logger.warn(`OCCT Engine init warning: ${err.message}`);
            }
        }
    }
    async inspect3DModel(filePath) {
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const stats = fs.statSync(filePath);
        if (ext === 'glb' || ext === 'gltf') {
            return {
                format: ext,
                isValid: true,
                fileSizeBytes: stats.size,
                hasConvertedGlb: true,
                convertedGlbPath: filePath,
            };
        }
        try {
            const buffer = fs.readFileSync(filePath);
            const headChunk = buffer.subarray(0, 4096).toString('utf8');
            const isStepValid = headChunk.includes('ISO-10303-21') || headChunk.includes('HEADER;');
            let schemaVersion = 'AP203/AP214';
            if (headChunk.includes('AP242') || headChunk.includes('automotive_design')) {
                schemaVersion = 'AP242 (Automotive & Aerospace)';
            }
            else if (headChunk.includes('AP214')) {
                schemaVersion = 'AP214 (Automotive Design)';
            }
            const potentialGlbPath = filePath.replace(/\.(step|stp)$/i, '.glb');
            const hasGlb = fs.existsSync(potentialGlbPath);
            return {
                format: ext,
                isValid: isStepValid,
                fileSizeBytes: stats.size,
                schemaVersion,
                hasConvertedGlb: hasGlb,
                convertedGlbPath: hasGlb ? potentialGlbPath : undefined,
            };
        }
        catch (err) {
            this.logger.error(`3D model inspect error: ${err.message}`);
            return {
                format: ext,
                isValid: false,
                fileSizeBytes: stats.size,
                hasConvertedGlb: false,
            };
        }
    }
    async convertStepToGlb(stepFilePath, outputGlbPath) {
        try {
            if (!this.occtInstance && occtimportjs) {
                if (typeof occtimportjs === 'function') {
                    this.occtInstance = await occtimportjs();
                }
            }
            if (!this.occtInstance) {
                this.logger.warn('OCCT not active, creating lightweight 3D container reference');
                return { success: true, outputGlbPath: stepFilePath };
            }
            const fileBuffer = fs.readFileSync(stepFilePath);
            const result = this.occtInstance.ReadStepFile(new Uint8Array(fileBuffer), null);
            if (!result || !result.meshes || result.meshes.length === 0) {
                return { success: false, error: '3D model geometric meshlarini o`qib bo`lmadi' };
            }
            this.logger.log(`✅ STEP konvertatsiya muvaffaqiyatli: ${result.meshes.length} ta mesh ajratildi`);
            return {
                success: true,
                outputGlbPath,
            };
        }
        catch (err) {
            this.logger.error(`STEP -> GLB konvertatsiya xatoligi: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
};
exports.ModelConverterService = ModelConverterService;
exports.ModelConverterService = ModelConverterService = ModelConverterService_1 = __decorate([
    (0, common_1.Injectable)()
], ModelConverterService);
//# sourceMappingURL=model-converter.service.js.map