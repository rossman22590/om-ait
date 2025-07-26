// utils.ts
import { fetchFileContent } from '@/hooks/react-query/files/use-file-queries';
import JSZip from 'jszip';

export async function zipAndDownloadFiles(
  sandboxId: string,
  filePaths: string[],
  token: string
) {
  const zip = new JSZip();
  for (const filePath of filePaths) {
    const content = await fetchFileContent(sandboxId, filePath, 'blob', token);
    zip.file(filePath.split('/').pop()!, content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected-files.zip';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function renameFile(
  sandboxId: string,
  oldPath: string,
  newName: string,
  token: string
) {
  const content = await fetchFileContent(sandboxId, oldPath, 'blob', token);
  const parts = oldPath.split('/');
  parts[parts.length - 1] = newName;
  const newPath = parts.join('/');
  // Upload to new path (use your uploadFile mutation/hook)
  // await uploadFile(sandboxId, newPath, content, token);
  // Delete old file
  // await deleteFileMutation.mutateAsync({ sandboxId, filePath: oldPath });
  // You must wire these to your actual upload/delete hooks
}
