import axios from "axios";

// REST API Auth Client — JWT-based authentication via backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let currentSessionUser = null;
const authListeners = new Set();

const notifyListeners = () => {
  authListeners.forEach((cb) => cb(currentSessionUser));
};

// Check local storage on startup for user session (supports new and legacy keys)
const savedToken = localStorage.getItem("mindquery_token") || localStorage.getItem("documind_token");
const savedUser = localStorage.getItem("mindquery_user") || localStorage.getItem("documind_user");

if (savedToken && savedUser) {
  try {
    currentSessionUser = {
      ...JSON.parse(savedUser),
      async getIdToken() {
        return localStorage.getItem("mindquery_token") || localStorage.getItem("documind_token");
      },
    };
  } catch (_e) {
    localStorage.removeItem("mindquery_token");
    localStorage.removeItem("mindquery_user");
    localStorage.removeItem("documind_token");
    localStorage.removeItem("documind_user");
  }
}

const persistAuth = (token, user) => {
  localStorage.setItem("mindquery_token", token);
  localStorage.setItem("mindquery_user", JSON.stringify(user));
  // Keep legacy keys synced for seamless upgrade
  localStorage.setItem("documind_token", token);
  localStorage.setItem("documind_user", JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem("mindquery_token");
  localStorage.removeItem("mindquery_user");
  localStorage.removeItem("documind_token");
  localStorage.removeItem("documind_user");
};

const signInUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const data = response.data;

    persistAuth(data.token, data.user);

    currentSessionUser = {
      ...data.user,
      async getIdToken() {
        return data.token;
      },
    };

    notifyListeners();
    return { user: currentSessionUser };
  } catch (err) {
    const errorMsg = err.response?.data?.error || "Login failed.";
    throw new Error(errorMsg);
  }
};

const registerUser = async (email, password, name = "") => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, { email, password, name });
    const data = response.data;

    persistAuth(data.token, data.user);

    currentSessionUser = {
      ...data.user,
      async getIdToken() {
        return data.token;
      },
    };

    notifyListeners();
    return { user: currentSessionUser };
  } catch (err) {
    const errorMsg = err.response?.data?.error || "Registration failed.";
    throw new Error(errorMsg);
  }
};

const logoutUser = async () => {
  clearAuth();
  currentSessionUser = null;
  notifyListeners();
};

const subscribeAuthState = (callback) => {
  authListeners.add(callback);
  callback(currentSessionUser);
  return () => {
    authListeners.delete(callback);
  };
};

const isMockAuth = false;

export {
  signInUser,
  registerUser,
  logoutUser,
  subscribeAuthState,
  isMockAuth,
};
