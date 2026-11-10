import { parseLastOpened } from '../utils/navigation';
import { storageKeys, useLocalValue } from '../utils/storage';

export function useLastOpened() {
  return useLocalValue(storageKeys.lastOpened, null, parseLastOpened);
}
