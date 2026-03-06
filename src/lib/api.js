// Frontend/src/lib/api.js

// ===============================
// Custom API Error Class
// ===============================
class ApiError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

// ===============================
// Get CSRF Token from Cookies
// ===============================
export const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

// ===============================
// Base API Fetch Function
// ===============================
export async function apiFetch(url, options = {}) {
  const BASE_URL = import.meta.env.VITE_API_URL;

  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not defined in environment variables.");
  }

  const method = (options.method || "GET").toUpperCase();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  const hasBody =
    options.body !== undefined && options.body !== null;

  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Attach CSRF token for unsafe methods
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      headers["X-CSRFToken"] = token;
    }
  }

  const fullUrl = `${BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    credentials: "include",
    ...options,
    headers,
    body: hasBody
      ? isFormData
        ? options.body
        : typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body
      : undefined,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.ok === false)) {
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

// Explicit export to avoid Vite build issues
export { ApiError };