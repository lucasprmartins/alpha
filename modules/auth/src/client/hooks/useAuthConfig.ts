import { useContext } from "react";
import { AuthContext, defaultAuthConfig, sessionOptions } from "../config";

export const useAuthConfig = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      ...defaultAuthConfig,
      queryKey: sessionOptions.queryKey,
    };
  }
  return context;
};
