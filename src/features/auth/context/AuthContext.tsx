// FILE: src/features/auth/context/AuthContext.tsx
import { createContext } from "react";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  MeResponse,
} from "@/types/user";

export interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (credentials: LoginRequest) => Promise<MeResponse | null>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<MeResponse | null>;
  changePassword: (
    payload: ChangePasswordRequest,
  ) => Promise<ChangePasswordResponse>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
