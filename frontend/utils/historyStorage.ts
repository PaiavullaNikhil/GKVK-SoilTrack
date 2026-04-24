import * as FileSystem from "expo-file-system/legacy";

const HISTORY_FILE = FileSystem.documentDirectory + "soil_scan_history.json";

export const loadHistory = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(HISTORY_FILE);
    if (!fileInfo.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(HISTORY_FILE);
    return JSON.parse(content);
  } catch (error) {
    console.error("[HistoryStorage] Error loading history:", error);
    return [];
  }
};

export const saveHistory = async (history: any[]) => {
  try {
    await FileSystem.writeAsStringAsync(HISTORY_FILE, JSON.stringify(history));
  } catch (error) {
    console.error("[HistoryStorage] Error saving history:", error);
  }
};

export const addToHistory = async (newEntry: any) => {
  try {
    const history = await loadHistory();
    const updatedHistory = [newEntry, ...history.slice(0, 9)];
    await saveHistory(updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error("[HistoryStorage] Error adding to history:", error);
    return [];
  }
};

export const deleteFromHistory = async (id: string) => {
  try {
    const history = await loadHistory();
    const updatedHistory = history.filter((item: any) => item.id !== id);
    await saveHistory(updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error("[HistoryStorage] Error deleting from history:", error);
    return [];
  }
};
