import type { GradingState } from '../store/slices/gradingSlice';
import type { BasicState } from '../store/slices/basicSlice';
import type { LutState } from '../store/slices/lutSlice';

const WORKSPACE_VERSION = 1;

export interface WorkspaceFile {
  version: number;
  fileName: string;
  mimeType: string;
  imageData: string; // base64
  gradingState: GradingState;
  basicState?: BasicState;
  lutState?: LutState;
}

export async function saveWorkspace(
  originalUrl: string,
  fileName: string,
  gradingState: GradingState,
  basicState?: BasicState,
  lutState?: LutState
): Promise<void> {
  // Fetch the blob from the object URL and convert to base64
  const response = await fetch(originalUrl);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const workspace: WorkspaceFile = {
    version: WORKSPACE_VERSION,
    fileName,
    mimeType,
    imageData: base64,
    gradingState,
    basicState,
    lutState,
  };

  const json = JSON.stringify(workspace);
  const outBlob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = fileName.replace(/\.[^.]+$/, '');
  a.download = `${baseName}.chromagrade-workspace`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadWorkspace(file: File): Promise<WorkspaceFile> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.chromagrade-workspace')) {
      reject(new Error('Invalid file type. Expected .chromagrade-workspace'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workspace = JSON.parse(e.target?.result as string) as WorkspaceFile;
        if (!workspace.version || !workspace.imageData || !workspace.gradingState) {
          throw new Error('Invalid workspace file');
        }
        resolve(workspace);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse workspace file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function workspaceToObjectUrl(workspace: WorkspaceFile): string {
  const byteString = atob(workspace.imageData);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
  const blob = new Blob([bytes], { type: workspace.mimeType });
  return URL.createObjectURL(blob);
}
