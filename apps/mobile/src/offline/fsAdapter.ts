import * as RNFS from '@dr.pogodin/react-native-fs';
import type { FileSystemPort } from './types';

/** react-native-fs implementation. Files live in the app's private documents directory. */
export const rnfsAdapter: FileSystemPort = {
  rootDir: `${RNFS.DocumentDirectoryPath}/offline`,
  mkdir: path => RNFS.mkdir(path),
  exists: path => RNFS.exists(path),
  unlink: async path => {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  },
  move: (from, to) => RNFS.moveFile(from, to),
  size: async path => Number((await RNFS.stat(path)).size),
  sha256: path => RNFS.hash(path, 'sha256'),
  download: async (url, toFile) => {
    const job = RNFS.downloadFile({ fromUrl: url, toFile, connectionTimeout: 15000, readTimeout: 30000 });
    const res = await job.promise;
    return { statusCode: res.statusCode, bytesWritten: res.bytesWritten };
  },
  listDir: async path => ((await RNFS.exists(path)) ? (await RNFS.readDir(path)).map(i => i.path) : []),
};
