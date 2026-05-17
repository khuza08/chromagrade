import type { Preset } from '../store/slices/presetsSlice';

export const exportPresets = (presets: Preset[]) => {
  const jsonString = JSON.stringify(presets, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chromagrade-presets.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importPresets = (file: File): Promise<Preset[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          throw new Error('Presets file must be a JSON array');
        }
        
        // Validate presets structure
        const validated: Preset[] = data.filter((item: any) => {
          return (
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.category === 'string' &&
            typeof item.parameters === 'object' &&
            item.parameters !== null
          );
        });

        if (validated.length === 0 && data.length > 0) {
          throw new Error('No valid presets found in the file');
        }

        resolve(validated);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};
