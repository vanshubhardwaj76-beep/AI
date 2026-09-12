import { Platform, Share } from 'react-native';
import { getDatabase } from '@/database';

export const exportService = {
  async exportJson(): Promise<{ ok: boolean; message: string }> {
    const db = await getDatabase();
    const snapshot = await db.exportAll();
    const json = JSON.stringify(snapshot, null, 2);
    const filename = `pipkin-export-${snapshot.exportedAt.slice(0, 10)}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: 'Download started.' };
    }

    try {
      const FS = await import('expo-file-system');
      const Sharing = await import('expo-sharing');
      const file = new FS.File(FS.Paths.cache, filename);
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Pipkin data' });
        return { ok: true, message: 'Export ready.' };
      }
    } catch (e) {
      console.warn('[export] file share failed, falling back to Share API', e);
    }
    await Share.share({ message: json, title: filename });
    return { ok: true, message: 'Export ready.' };
  },
};
