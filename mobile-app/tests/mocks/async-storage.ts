// In-memory mock for AsyncStorage in headless Node.js test environment
const memoryStore = new Map<string, string>();

const mockAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    memoryStore.delete(key);
  },
  clear: async (): Promise<void> => {
    memoryStore.clear();
  },
  getAllKeys: async (): Promise<string[]> => {
    return Array.from(memoryStore.keys());
  },
};

export default mockAsyncStorage;
