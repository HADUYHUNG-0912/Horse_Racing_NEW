const BASE_URL = "http://127.0.0.1:8000/api/v1";

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  // Generic methods
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async post(endpoint, data) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async put(endpoint, data) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    // DELETE trả về 204 No Content, không có body
    return res.status === 204 ? null : res.json().catch(() => null);
  },

  // Auth methods
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${BASE_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }

    const tokenData = await res.json();
    localStorage.setItem("token", tokenData.access_token);
    return tokenData;
  },

  async register(data) {
    return this.post("/auth/register", data);
  },

  async getMe() {
    return this.get("/auth/me");
  },

  logout() {
    localStorage.removeItem("token");
  },
};
export const fetchPrizes = (tournamentId) => 
  api.get(`/tournaments/${tournamentId}/prizes`);

export const createPrize = (tournamentId, data) => 
  api.post(`/tournaments/${tournamentId}/prizes`, data);

export const updateTournamentStatus = (id, status) => 
  api.put(`/tournaments/${id}/status`, { new_status: status });

export const fetchAdminStats = () => 
  api.get(`/admin/stats`);

export const fetchAdminUsers = (params) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/admin/users?${query}`);
};