import React, { createContext, useContext, useEffect, useState } from "react";

import { User } from "../models/User";
import { useApi } from "./ApiProvider";

interface AuthContextType {

  user: User | null;
  profile: User | null;

  isAuthenticated: boolean;
  isAdmin: boolean;

  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {

  const api = useApi();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("accessToken");

    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }

  }, []);

  const fetchMe = async () => {

    // debugger
    try {

      const res = await api.get("/api/auth/me/");

      if (!res.ok) {
        logout();
        return;
      }

      const userData = new User(res.body);

      setUser(userData);
      setProfile(userData);
      setIsAuthenticated(true);

      localStorage.setItem("user", JSON.stringify(userData));

    } finally {

      setLoading(false);

    }
  };

  const login = async (email: string, password: string) => {

    const res = await api.post("/api/auth/login/", {
      email,
      password,
    } , { auth: false });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const { access, user } = res.body;

    localStorage.setItem("accessToken", access);
    localStorage.setItem("user", JSON.stringify(user));

    const userData = new User(user);

    setUser(userData);
    setProfile(userData);
    setIsAuthenticated(true);
  };

  const register = async (data: any) => {

    const res = await api.post(
  "/api/auth/register/",
  data,
  { auth: false }
);


    if (!res.ok) {
      throw new Error("Register failed");
    }

    const { access, user } = res.body;

    localStorage.setItem("accessToken", access);
    localStorage.setItem("user", JSON.stringify(user));

    const userData = new User(user);

    setUser(userData);
    setProfile(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);

    window.location.href = "/auth";
  };

  const isAdmin = profile?.is_admin ?? false;

  return (

    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>

  );
};

export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
