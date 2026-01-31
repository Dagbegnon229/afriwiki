import { createClient } from "./client";

export type AuthError = {
  message: string;
  code?: string;
};

export type AuthResult<T = void> = {
  data: T | null;
  error: AuthError | null;
};

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      data: null,
      error: {
        message: getErrorMessage(error.message),
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Sign in with email and password
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: getErrorMessage(error.message),
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Sign out
export const signOut = async (): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Sign in with OAuth provider
export const signInWithOAuth = async (
  provider: "google" | "linkedin_oidc"
): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Request password reset
export const resetPassword = async (email: string): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: getErrorMessage(error.message),
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Update password
export const updatePassword = async (
  newPassword: string
): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return { data: null, error: null };
};

// Get current user
export const getCurrentUser = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Get current session
export const getSession = async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

// Helper function to translate error messages to French
const getErrorMessage = (message: string): string => {
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "Email not confirmed": "Veuillez confirmer votre email avant de vous connecter",
    "User already registered": "Un compte existe déjà avec cet email",
    "Password should be at least 6 characters":
      "Le mot de passe doit contenir au moins 6 caractères",
    "Unable to validate email address: invalid format":
      "Format d'email invalide",
    "Email rate limit exceeded":
      "Trop de tentatives. Veuillez réessayer plus tard",
    "For security purposes, you can only request this once every 60 seconds":
      "Pour des raisons de sécurité, attendez 60 secondes avant de réessayer",
  };

  return errorMessages[message] || message;
};
