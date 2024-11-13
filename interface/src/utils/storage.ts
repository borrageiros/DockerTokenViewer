export function save(key: string, value: any): void {
  const valueString = JSON.stringify(value);
  localStorage.setItem(key, valueString);
}

export function get(key: string): any | null {
  const valueString = localStorage.getItem(key);
  if (valueString) {
    return JSON.parse(valueString);
  }
  return null;
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

const storage = { save, get, remove };
export default storage;
