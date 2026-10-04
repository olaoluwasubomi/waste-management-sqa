"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AdminProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  role: string;
};

type UpdateProfileInput = {
  fullName: string;
  email: string;
  password?: string;
  profileImage?: File | null;
};

type AdminProfileContextType = {
  profile: AdminProfile | null;
  isLoadingProfile: boolean;
  isUpdatingProfile: boolean;
  profileError: string;
  fetchProfile: () => Promise<void>;
  updateProfile: (
    input: UpdateProfileInput
  ) => Promise<AdminProfile>;
};

const AdminProfileContext =
  createContext<AdminProfileContextType | undefined>(undefined);

export function AdminProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError("");

      const response = await fetch("/api/admin/update-profile", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to retrieve profile"
        );
      }

      setProfile(result.user);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to retrieve profile";

      setProfileError(message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      try {
        setIsUpdatingProfile(true);
        setProfileError("");

        const formData = new FormData();

        formData.append("fullName", input.fullName.trim());
        formData.append("email", input.email.trim());

        if (input.password?.trim()) {
          formData.append("password", input.password);
        }

        if (input.profileImage) {
          formData.append(
            "profileImage",
            input.profileImage
          );
        }

        const response = await fetch(
          "/api/admin/update-profile",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to update profile"
          );
        }

        setProfile(result.user);

        return result.user as AdminProfile;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to update profile";

        setProfileError(message);
        throw error;
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const value = useMemo(
    () => ({
      profile,
      isLoadingProfile,
      isUpdatingProfile,
      profileError,
      fetchProfile,
      updateProfile,
    }),
    [
      profile,
      isLoadingProfile,
      isUpdatingProfile,
      profileError,
      fetchProfile,
      updateProfile,
    ]
  );

  return (
    <AdminProfileContext.Provider value={value}>
      {children}
    </AdminProfileContext.Provider>
  );
}

export function useAdminProfile() {
  const context = useContext(AdminProfileContext);

  if (!context) {
    throw new Error(
      "useAdminProfile must be used inside AdminProfileProvider"
    );
  }

  return context;
}