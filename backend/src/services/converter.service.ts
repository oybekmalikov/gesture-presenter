import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const execFileAsync = promisify(execFile);

if (!globalThis.FileReader) {
  class NodeFileReader extends EventTarget {
    onload: ((e: { target: NodeFileReader }) => void) | null = null;
    onloadend: ((e: { target: NodeFileReader }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    result: ArrayBuffer | string | null = null;

    readAsArrayBuffer(blob: Blob) {
      blob.arrayBuffer()
        .then((buf) => {
          this.result = buf;
          const ev = { target: this };
          if (this.onload) this.onload(ev);
          if (this.onloadend) this.onloadend(ev);
          this.dispatchEvent(new Event('load'));
          this.dispatchEvent(new Event('loadend'));
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
          if (this.onloadend) this.onloadend({ target: this });
          this.dispatchEvent(new Event('error'));
          this.dispatchEvent(new Event('loadend'));
        });
    }

    readAsDataURL(blob: Blob) {
      blob.arrayBuffer()
        .then((buf) => {
          const base64 = Buffer.from(buf).toString('base64');
          this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
          const ev = { target: this };
          if (this.onload) this.onload(ev);
          if (this.onloadend) this.onloadend(ev);
          this.dispatchEvent(new Event('load'));
          this.dispatchEvent(new Event('loadend'));
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
          if (this.onloadend) this.onloadend({ target: this });
          this.dispatchEvent(new Event('error'));
          this.dispatchEvent(new Event('loadend'));
        });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).FileReader = NodeFileReader;
}

let occtInstance: any = null;

async function getOcct() {
  if (!occtInstance) {
    const occtModule = await import('occt-import-js');
    const init = occtModule.default || occtModule;
    occtInstance = await init();
  }
  return occtInstance;
}

export class ConverterService {
  static async convertPptxToPdf(inputPptxPath: string, outputPdfPath: string): Promise<void> {
    const tempDir = path.dirname(outputPdfPath);
    const fileNameWithoutExt = path.basename(inputPptxPath, path.extname(inputPptxPath));
    const expectedPdfName = `${fileNameWithoutExt}.pdf`;
    const generatedPdfPath = path.join(tempDir, expectedPdfName);

    console.log(`[Converter] Converting PPTX to PDF: ${inputPptxPath} -> ${generatedPdfPath}`);

    try {
      const sofficeBin = fsSync.existsSync('/usr/bin/soffice') ? '/usr/bin/soffice' : 'soffice';
      const { stdout, stderr } = await execFileAsync(sofficeBin, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        tempDir,
        inputPptxPath,
      ]);
      if (stdout) console.log(`[Converter soffice stdout]:`, stdout);
      if (stderr) console.warn(`[Converter soffice stderr]:`, stderr);
      if (!fsSync.existsSync(generatedPdfPath)) {
        throw new Error(`PDF fayl yaratilmadi: ${generatedPdfPath}`);
      }
      if (generatedPdfPath !== outputPdfPath) {
        await fs.rename(generatedPdfPath, outputPdfPath);
      }
    } catch (err: any) {
      throw new Error(`Fileni qayta ishlashda xatolik: ${err.message}`);
    }
  }

  static async convertStepToGlb(
    inputStepPath: string,
    outputGlbPath: string,
    modelName: string = 'CADModel'
  ): Promise<void> {
    try {
      const occt = await getOcct();
      const fileBuffer = await fs.readFile(inputStepPath);
      const uint8Array = new Uint8Array(fileBuffer);
      const result = occt.ReadStepFile(uint8Array, null);
      if (!result || !result.success || !result.meshes || result.meshes.length === 0) {
        throw new Error("Modelni o'qib bo'lmadi");
      }
      const scene = new THREE.Scene();
      scene.name = modelName;
      const rootGroup = new THREE.Group();
      rootGroup.name = modelName;
      const defaultColors = [
        0x00e5ff, // Cyan
        0xf59e0b, // Amber
        0x3b82f6, // Industrial Blue
        0x8b5cf6, // Purple
        0x10b981, // Emerald
        0x64748b, // Steel Slate
        0x94a3b8, // Light Slate
        0xd97706, // Bronze
      ];
      result.meshes.forEach((meshData: any, index: number) => {
        const geometry = new THREE.BufferGeometry();
        if (meshData.attributes?.position?.array) {
          const posArr = meshData.attributes.position.array instanceof Float32Array
            ? meshData.attributes.position.array
            : new Float32Array(meshData.attributes.position.array);
          geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        }
        if (meshData.attributes?.normal?.array) {
          const normArr = meshData.attributes.normal.array instanceof Float32Array
            ? meshData.attributes.normal.array
            : new Float32Array(meshData.attributes.normal.array);
          geometry.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
        } else {
          geometry.computeVertexNormals();
        }
        if (meshData.index?.array) {
          const idxArr = meshData.index.array instanceof Uint32Array || meshData.index.array instanceof Uint16Array
            ? meshData.index.array
            : new Uint32Array(meshData.index.array);
          geometry.setIndex(new THREE.BufferAttribute(idxArr, 1));
        }
        let materialColor: THREE.Color;
        if (meshData.color && Array.isArray(meshData.color) && meshData.color.length >= 3) {
          materialColor = new THREE.Color(meshData.color[0], meshData.color[1], meshData.color[2]);
        } else {
          materialColor = new THREE.Color(defaultColors[index % defaultColors.length]);
        }
        const material = new THREE.MeshStandardMaterial({
          color: materialColor,
          roughness: 0.35,
          metalness: 0.55,
        });
        const partMesh = new THREE.Mesh(geometry, material);
        const partName = meshData.name || `Part_${index + 1}`;
        partMesh.name = partName;
        partMesh.userData = {
          selectableId: partMesh.uuid,
          partIndex: index + 1,
          name: partName,
          originalColor: materialColor.getHexString(),
        };
        rootGroup.add(partMesh);
      });
      const bbox = new THREE.Box3().setFromObject(rootGroup);
      const center = bbox.getCenter(new THREE.Vector3());
      rootGroup.position.sub(center);
      scene.add(rootGroup);
      const exporter = new GLTFExporter();
      const glbArrayBuffer = (await exporter.parseAsync(scene, {
        binary: true,
      })) as ArrayBuffer;
      const glbBuffer = Buffer.from(glbArrayBuffer);
      await fs.writeFile(outputGlbPath, glbBuffer);
    } catch (err: any) {
      throw new Error(`Fileni qayta ishlashda xatolik: ${err.message}`);
    }
  }
}
