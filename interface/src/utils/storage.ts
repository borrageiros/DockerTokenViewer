export function saveLocal(key: string, value: any): void {
  const valueString = JSON.stringify(value);
  localStorage.setItem(key, valueString);
}

export function getLocal(key: string): any | null {
  const valueString = localStorage.getItem(key);
  if (valueString) {
    return JSON.parse(valueString);
  }
  return null;
}

export function saveCookie(key: string, value: any, remember: boolean = false): void {
  const valueString = JSON.stringify(value);
  const expirationDate = new Date();
  
  if (remember) {
    expirationDate.setTime(expirationDate.getTime() + (365 * 24 * 60 * 60 * 1000 * 100));
  } else {
    expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000));
  }
  
  document.cookie = `${key}=${encodeURIComponent(valueString)};expires=${expirationDate.toUTCString()};path=/;Secure;SameSite=Strict`;
}

export function getCookie(key: string): any | null {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieKey, cookieValue] = cookie.trim().split('=');
    if (cookieKey === key) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function remove(key: string): void {
  document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// TEMPORAL
const cleanupLocalStorage = () => {
  const keysToRemove = ['DTVAuth', 'DTVRepository'];
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};
cleanupLocalStorage();
// FIN TEMPORAL

const storage = { saveLocal, getLocal, saveCookie, getCookie, remove };
export default storage;
