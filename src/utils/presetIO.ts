import JSZip from 'jszip';
import type { Preset } from '../store/slices/presetsSlice';

export interface ImportResult {
  importedPresets: Preset[];
  totalFound: number;
}

const sanitizeName = (str: string) => 
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const validatePreset = (item: any): item is Preset => {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.category === 'string' &&
    typeof item.parameters === 'object' &&
    item.parameters !== null
  );
};

export const exportPresets = async (presets: Preset[]) => {
  if (presets.length === 0) return;

  if (presets.length === 1) {
    const preset = presets[0];
    const sanitized = sanitizeName(preset.name);
    const jsonString = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitized}.chromagrade`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const zip = new JSZip();
    const nameMap = new Map<string, number>();

    for (const preset of presets) {
      const baseName = sanitizeName(preset.name);
      let fileName = `${baseName}.chromagrade`;
      
      // Prevent collisions in case multiple presets have identical names
      if (nameMap.has(baseName)) {
        const count = nameMap.get(baseName)! + 1;
        nameMap.set(baseName, count);
        fileName = `${baseName}-${count}.chromagrade`;
      } else {
        nameMap.set(baseName, 1);
      }

      zip.file(fileName, JSON.stringify(preset, null, 2));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chromagrade-preset-pack-${date}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const importPresets = (file: File): Promise<ImportResult> => {
  return new Promise(async (resolve, reject) => {
    if (file.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const jsonFiles = Object.keys(zip.files).filter(name => name.endsWith('.chromagrade') || name.endsWith('.json'));
        
        const totalFound = jsonFiles.length;
        const importedPresets: Preset[] = [];

        for (const filename of jsonFiles) {
          try {
            const content = await zip.files[filename].async('string');
            const data = JSON.parse(content);
            if (validatePreset(data)) {
              importedPresets.push(data);
            }
          } catch (err) {
            // Silently skip malformed JSON files inside the ZIP
          }
        }

        if (totalFound === 0) {
          reject(new Error('No .chromagrade files found in the archive'));
          return;
        }

        if (importedPresets.length === 0) {
          reject(new Error('No valid presets found in the archive'));
          return;
        }

        resolve({ importedPresets, totalFound });
      } catch (err) {
        reject(new Error('Invalid or corrupted zip archive'));
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          // Legacy support: single preset object or an array of presets
          const dataArray = Array.isArray(raw) ? raw : [raw];
          const totalFound = dataArray.length;

          const importedPresets = dataArray.filter(validatePreset);

          if (importedPresets.length === 0 && totalFound > 0) {
            throw new Error('No valid presets found in the file');
          }

          resolve({ importedPresets, totalFound });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Invalid JSON format'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    }
  });
};
