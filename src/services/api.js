const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function call(path, options = {}) {
  const token = localStorage.getItem("ks_token");
  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Connection error");
    error.status = response.status;
    throw error;
  }

  return data;
}
