const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

function redirectToLoginIfNeeded() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  const onPublicPage = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  if (!onPublicPage) {
    window.location.href = "/login?reason=session-expired";
  }
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onTokenRefreshed(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;

  const performFetch = async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      const isPublicAuthEndpoint =
        endpoint.includes("/auth/Login") ||
        endpoint.includes("/auth/Signup") ||
        endpoint.includes("/auth/forgot-password") ||
        endpoint.includes("/auth/reset-password");
      const isMeEndpoint = endpoint.includes("/auth/me");
      const isRefreshEndpoint = endpoint.includes("/auth/Refresh");

      const isUnauthorized = response.status === 401 || response.status === 400;
      const shouldTryRefresh =
        isUnauthorized &&
        !isRefreshEndpoint &&
        !isPublicAuthEndpoint &&
        !isMeEndpoint;

      if (shouldTryRefresh) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/Refresh`, {
              method: "POST",
              credentials: "include",
            });
            const refreshData = await refreshRes.json();

            if (refreshRes.ok && refreshData.success) {
              isRefreshing = false;
              onTokenRefreshed(true);
              return performFetch();
            } else {
              throw new Error("Session expired");
            }
          } catch (error) {
            isRefreshing = false;
            onTokenRefreshed(false);
            redirectToLoginIfNeeded();
            throw new Error("Session expired. Please log in again.");
          }
        }

        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (success) {
              resolve(performFetch());
            } else {
              redirectToLoginIfNeeded();
              reject(new Error("Session expired. Please log in again."));
            }
          });
        });
      }

      if (isUnauthorized && isMeEndpoint) {
        redirectToLoginIfNeeded();
        throw new Error("Session expired. Please log in again.");
      }

      throw new Error(data.error || "Something went wrong");
    }

    return data;
  };

  return performFetch();
}
