"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileDown,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type SettingsTab =
  | "PROFILE"
  | "SECURITY"
  | "COLLECTION"
  | "NOTIFICATIONS"
  | "ACCOUNT";

type PickupPeriod = "MORNING" | "AFTERNOON" | "EVENING";

type QuantityUnit =
  | "BAG"
  | "BIN"
  | "ITEM"
  | "KILOGRAM"
  | "TONNE"
  | "OTHER";

type UserRole = "USER" | "ADMIN" | "COLLECTOR";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  role: UserRole;
}

interface UserSettingsResponse {
  success?: boolean;
  user?: UserProfile;
  error?: string;
}

interface RawAddress {
  id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface CollectionPreferences {
  preferredPickupPeriod: PickupPeriod;
  defaultQuantityUnit: QuantityUnit;
  defaultAddressId: string;
  pickupInstructions: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pickupReminders: boolean;
  statusUpdates: boolean;
  paymentUpdates: boolean;
}

interface AddressOption {
  id: string;
  label: string;
  formatted: string;
  isDefault: boolean;
}

interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  submit?: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  submit?: string;
}

const settingsTabs: {
  value: SettingsTab;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "PROFILE",
    label: "Profile",
    description: "Personal information",
    icon: UserRound,
  },
  {
    value: "SECURITY",
    label: "Security",
    description: "Password and account access",
    icon: ShieldCheck,
  },
  {
    value: "COLLECTION",
    label: "Collection",
    description: "Default pickup preferences",
    icon: Package,
  },
  {
    value: "NOTIFICATIONS",
    label: "Notifications",
    description: "Choose how we contact you",
    icon: Bell,
  },
  {
    value: "ACCOUNT",
    label: "Account",
    description: "Data and account actions",
    icon: Settings2,
  },
];

const pickupPeriods: {
  value: PickupPeriod;
  label: string;
  description: string;
}[] = [
  {
    value: "MORNING",
    label: "Morning",
    description: "8:00 AM – 12:00 PM",
  },
  {
    value: "AFTERNOON",
    label: "Afternoon",
    description: "12:00 PM – 4:00 PM",
  },
  {
    value: "EVENING",
    label: "Evening",
    description: "4:00 PM – 7:00 PM",
  },
];

const quantityUnits: {
  value: QuantityUnit;
  label: string;
}[] = [
  { value: "BAG", label: "Bag" },
  { value: "BIN", label: "Bin" },
  { value: "ITEM", label: "Item" },
  { value: "KILOGRAM", label: "Kilogram" },
  { value: "TONNE", label: "Tonne" },
  { value: "OTHER", label: "Other" },
];

function formatAddress(address: RawAddress) {
  return [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("PROFILE");

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(
    null,
  );

  const [selectedImage, setSelectedImage] = useState<File | null>(
    null,
  );

  const [addresses, setAddresses] = useState<AddressOption[]>([]);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [profileLoadError, setProfileLoadError] = useState<
    string | null
  >(null);

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [collectionPreferences, setCollectionPreferences] =
    useState<CollectionPreferences>({
      preferredPickupPeriod: "MORNING",
      defaultQuantityUnit: "BAG",
      defaultAddressId: "",
      pickupInstructions: "",
    });

  const [notifications, setNotifications] =
    useState<NotificationPreferences>({
      emailNotifications: true,
      smsNotifications: false,
      pickupReminders: true,
      statusUpdates: true,
      paymentUpdates: true,
    });

  const [profileErrors, setProfileErrors] =
    useState<ProfileErrors>({});

  const [passwordErrors, setPasswordErrors] =
    useState<PasswordErrors>({});

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isSavingCollection, setIsSavingCollection] =
    useState(false);

  const [isSavingNotifications, setIsSavingNotifications] =
    useState(false);

  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] =
    useState("");

  const [isDeletingAccount, setIsDeletingAccount] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        setIsLoadingProfile(true);
        setProfileLoadError(null);

        const [profileResponse, addressResponse] =
          await Promise.all([
            fetch("/api/admin/settings", {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }),

            fetch("/api/user/addresses", {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }),
          ]);

        const profileResult =
          (await profileResponse.json()) as UserSettingsResponse;

        if (
          !profileResponse.ok ||
          !profileResult.success ||
          !profileResult.user
        ) {
          throw new Error(
            profileResult.error ??
              "Unable to load your profile information",
          );
        }

        const user = profileResult.user;

        setProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });

        setProfileImage(user.image);

        /*
         * The addresses endpoint returns a plain array.
         * An empty array is valid when the user has no address.
         */
        if (addressResponse.ok) {
          const addressResult =
            (await addressResponse.json()) as RawAddress[];

          const formattedAddresses: AddressOption[] =
            addressResult.map((address) => ({
              id: address.id,
              label: address.label ?? "Pickup address",
              formatted: formatAddress(address),
              isDefault: address.isDefault,
            }));

          setAddresses(formattedAddresses);

          const defaultAddress =
            formattedAddresses.find(
              (address) => address.isDefault,
            ) ?? formattedAddresses[0];

          if (defaultAddress) {
            setCollectionPreferences(
              (currentPreferences) => ({
                ...currentPreferences,
                defaultAddressId:
                  currentPreferences.defaultAddressId ||
                  defaultAddress.id,
              }),
            );
          }
        } else {
          console.error(
            `Unable to load addresses: ${addressResponse.status}`,
          );

          setAddresses([]);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("LOAD USER SETTINGS ERROR:", error);

        setProfileLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load your settings",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadSettings();

    return () => {
      controller.abort();
    };
  }, []);

  const fullName = useMemo(() => {
    return [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");
  }, [profile.firstName, profile.lastName]);

  function showSuccess(message: string) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  }

  function updateProfileField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));

    setProfileErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      submit: undefined,
    }));
  }

  function updatePasswordField<K extends keyof PasswordForm>(
    field: K,
    value: PasswordForm[K],
  ) {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setPasswordErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      submit: undefined,
    }));
  }

  function handleProfileImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const imageFile = event.target.files?.[0];

    if (!imageFile) {
      return;
    }

    if (!imageFile.type.startsWith("image/")) {
      setProfileErrors((currentErrors) => ({
        ...currentErrors,
        submit: "Please select a valid image file.",
      }));

      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      setProfileErrors((currentErrors) => ({
        ...currentErrors,
        submit: "Profile image must be smaller than 5 MB.",
      }));

      return;
    }

    if (profileImage?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImage);
    }

    const previewUrl = URL.createObjectURL(imageFile);

    setSelectedImage(imageFile);
    setProfileImage(previewUrl);

    setProfileErrors((currentErrors) => ({
      ...currentErrors,
      submit: undefined,
    }));
  }

  function validateProfile() {
    const errors: ProfileErrors = {};

    if (!profile.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!profile.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (!profile.email.trim()) {
      errors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ) {
      errors.email = "Enter a valid email address.";
    }

    setProfileErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validateProfile()) {
      return;
    }

    try {
      setIsSavingProfile(true);

      setProfileErrors((currentErrors) => ({
        ...currentErrors,
        submit: undefined,
      }));

      const formData = new FormData();

      const updatedFullName = [
        profile.firstName.trim(),
        profile.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      formData.append("fullName", updatedFullName);
      formData.append("email", profile.email.trim());

      if (selectedImage) {
        formData.append("profileImage", selectedImage);
      }

      const response = await fetch("/api/admin/update-profile", {
        method: "POST",
        body: formData,
      });

      const result =
        (await response.json()) as UserSettingsResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.user
      ) {
        throw new Error(
          result.error ?? "Unable to update your profile",
        );
      }

      setProfile({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      });

      setProfileImage(result.user.image);
      setSelectedImage(null);

      showSuccess("Profile information saved successfully.");
    } catch (error) {
      console.error("UPDATE USER PROFILE ERROR:", error);

      setProfileErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error instanceof Error
            ? error.message
            : "Unable to update your profile.",
      }));
    } finally {
      setIsSavingProfile(false);
    }
  }

  function validatePassword() {
    const errors: PasswordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Enter your current password.";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "Enter a new password.";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword =
        "Password must contain at least 8 characters.";
    } else if (
      !/[A-Z]/.test(passwordForm.newPassword) ||
      !/[a-z]/.test(passwordForm.newPassword) ||
      !/\d/.test(passwordForm.newPassword)
    ) {
      errors.newPassword =
        "Include uppercase, lowercase and numeric characters.";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (
      passwordForm.currentPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      errors.newPassword =
        "Your new password must differ from your current password.";
    }

    setPasswordErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setIsSavingPassword(true);

      /*
       * Connect this to:
       * PATCH /api/user/settings/password
       */
      await new Promise((resolve) => setTimeout(resolve, 700));

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showSuccess("Password changed successfully.");
    } catch {
      setPasswordErrors((currentErrors) => ({
        ...currentErrors,
        submit: "Unable to change your password.",
      }));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleCollectionSave() {
    try {
      setIsSavingCollection(true);

      /*
       * Connect this to:
       * PATCH /api/user/settings/preferences
       */
      await new Promise((resolve) => setTimeout(resolve, 700));

      showSuccess("Collection preferences saved.");
    } finally {
      setIsSavingCollection(false);
    }
  }

  async function handleNotificationSave() {
    try {
      setIsSavingNotifications(true);

      /*
       * Connect this to:
       * PATCH /api/user/settings/notifications
       */
      await new Promise((resolve) => setTimeout(resolve, 700));

      showSuccess("Notification preferences saved.");
    } finally {
      setIsSavingNotifications(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") {
      return;
    }

    try {
      setIsDeletingAccount(true);

      /*
       * Connect this to:
       * DELETE /api/user/account
       */
      await new Promise((resolve) => setTimeout(resolve, 900));

      setDeleteModalOpen(false);
      setDeleteConfirmation("");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  if (isLoadingProfile) {
    return (
      <main className="min-h-screen bg-[#f4f7f2]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

            <p className="mt-4 text-sm font-semibold text-gray-500">
              Loading your settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (profileLoadError) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10">
        <section className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-gray-950">
            Unable to load settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {profileLoadError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f4f7f2]">
        <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
              Personal settings
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Manage your personal information, collection preferences,
              notifications and account security.
            </p>
          </header>

          {successMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
                <Check size={17} strokeWidth={3} />
              </div>

              <p className="text-sm font-semibold">
                {successMessage}
              </p>

              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="ml-auto rounded-full p-1 text-green-700 transition hover:bg-green-100"
                aria-label="Close success message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <SettingsNavigation
              activeTab={activeTab}
              onChange={setActiveTab}
              profileImage={profileImage}
              fullName={fullName}
              email={profile.email}
            />

            <section className="min-w-0">
              {activeTab === "PROFILE" && (
                <ProfileSettings
                  profile={profile}
                  profileImage={profileImage}
                  selectedImage={selectedImage}
                  errors={profileErrors}
                  isSaving={isSavingProfile}
                  onImageChange={handleProfileImageChange}
                  onFieldChange={updateProfileField}
                  onSubmit={handleProfileSubmit}
                />
              )}

              {activeTab === "SECURITY" && (
                <SecuritySettings
                  form={passwordForm}
                  errors={passwordErrors}
                  isSaving={isSavingPassword}
                  showCurrentPassword={showCurrentPassword}
                  showNewPassword={showNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  onToggleCurrent={() =>
                    setShowCurrentPassword((current) => !current)
                  }
                  onToggleNew={() =>
                    setShowNewPassword((current) => !current)
                  }
                  onToggleConfirm={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  onFieldChange={updatePasswordField}
                  onSubmit={handlePasswordSubmit}
                />
              )}

              {activeTab === "COLLECTION" && (
                <CollectionSettings
                  preferences={collectionPreferences}
                  addresses={addresses}
                  isSaving={isSavingCollection}
                  onChange={setCollectionPreferences}
                  onSave={handleCollectionSave}
                />
              )}

              {activeTab === "NOTIFICATIONS" && (
                <NotificationSettings
                  preferences={notifications}
                  isSaving={isSavingNotifications}
                  onChange={setNotifications}
                  onSave={handleNotificationSave}
                />
              )}

              {activeTab === "ACCOUNT" && (
                <AccountSettings
                  onDelete={() => setDeleteModalOpen(true)}
                />
              )}
            </section>
          </div>
        </div>
      </main>

      {deleteModalOpen && (
        <DeleteAccountModal
          confirmation={deleteConfirmation}
          isDeleting={isDeletingAccount}
          onConfirmationChange={setDeleteConfirmation}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteConfirmation("");
          }}
          onDelete={handleDeleteAccount}
        />
      )}
    </>
  );
}

function SettingsNavigation({
  activeTab,
  onChange,
  profileImage,
  fullName,
  email,
}: {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
  profileImage: string | null;
  fullName: string;
  email: string;
}) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              image={profileImage}
              name={fullName}
              size="small"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-gray-950">
                {fullName || "Resident"}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-500">
                {email || "No email available"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange(tab.value)}
                className={`flex min-w-[190px] items-center gap-3 rounded-2xl px-3 py-3 text-left transition lg:w-full lg:min-w-0 ${
                  selected
                    ? "bg-gray-950 text-white shadow-sm"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? "bg-white/10 text-green-300"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{tab.label}</p>

                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {tab.description}
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className={
                    selected ? "text-gray-400" : "text-gray-300"
                  }
                />
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function ProfileSettings({
  profile,
  profileImage,
  selectedImage,
  errors,
  isSaving,
  onImageChange,
  onFieldChange,
  onSubmit,
}: {
  profile: ProfileForm;
  profileImage: string | null;
  selectedImage: File | null;
  errors: ProfileErrors;
  isSaving: boolean;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: <K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <SettingsPanel
      eyebrow="Profile"
      title="Personal information"
      description="Keep your profile information accurate and up to date."
      icon={UserRound}
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center">
          <div className="relative">
            <ProfileAvatar
              image={profileImage}
              name={`${profile.firstName} ${profile.lastName}`}
              size="large"
            />

            <label
              htmlFor="profile-image"
              className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-gray-50 bg-gray-950 text-white shadow-sm transition hover:bg-green-800"
              aria-label="Choose profile image"
            >
              <Camera size={17} />
            </label>

            <input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
              className="sr-only"
            />
          </div>

          <div>
            <h3 className="font-black text-gray-950">
              Profile photo
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Upload a JPG, PNG or WebP image. Maximum file size is
              5 MB.
            </p>

            {selectedImage && (
              <p className="mt-2 text-xs font-semibold text-green-700">
                Selected: {selectedImage.name}
              </p>
            )}
          </div>
        </div>

        {errors.submit && <FormAlert message={errors.submit} />}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <TextField
            id="firstName"
            label="First name"
            value={profile.firstName}
            error={errors.firstName}
            icon={UserRound}
            onChange={(value) =>
              onFieldChange("firstName", value)
            }
          />

          <TextField
            id="lastName"
            label="Last name"
            value={profile.lastName}
            error={errors.lastName}
            icon={UserRound}
            onChange={(value) =>
              onFieldChange("lastName", value)
            }
          />

          <div className="sm:col-span-2">
            <TextField
              id="email"
              label="Email address"
              type="email"
              value={profile.email}
              error={errors.email}
              icon={Mail}
              onChange={(value) =>
                onFieldChange("email", value)
              }
            />
          </div>
        </div>

        <PanelFooter>
          <SaveButton
            label="Save profile"
            loadingLabel="Saving profile..."
            isLoading={isSaving}
          />
        </PanelFooter>
      </form>
    </SettingsPanel>
  );
}

function SecuritySettings({
  form,
  errors,
  isSaving,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onToggleCurrent,
  onToggleNew,
  onToggleConfirm,
  onFieldChange,
  onSubmit,
}: {
  form: PasswordForm;
  errors: PasswordErrors;
  isSaving: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onToggleCurrent: () => void;
  onToggleNew: () => void;
  onToggleConfirm: () => void;
  onFieldChange: <K extends keyof PasswordForm>(
    field: K,
    value: PasswordForm[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <SettingsPanel
      eyebrow="Security"
      title="Password and account access"
      description="Use a strong password that you do not use on other websites."
      icon={ShieldCheck}
    >
      <form onSubmit={onSubmit}>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700">
              <LockKeyhole size={19} />
            </div>

            <div>
              <p className="text-sm font-bold text-blue-950">
                Protect your account
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800/70">
                Your password should contain uppercase and lowercase
                letters, a number and at least eight characters.
              </p>
            </div>
          </div>
        </div>

        {errors.submit && <FormAlert message={errors.submit} />}

        <div className="mt-7 space-y-5">
          <PasswordField
            id="currentPassword"
            label="Current password"
            value={form.currentPassword}
            error={errors.currentPassword}
            visible={showCurrentPassword}
            onToggle={onToggleCurrent}
            onChange={(value) =>
              onFieldChange("currentPassword", value)
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              id="newPassword"
              label="New password"
              value={form.newPassword}
              error={errors.newPassword}
              visible={showNewPassword}
              onToggle={onToggleNew}
              onChange={(value) =>
                onFieldChange("newPassword", value)
              }
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              onToggle={onToggleConfirm}
              onChange={(value) =>
                onFieldChange("confirmPassword", value)
              }
            />
          </div>
        </div>

        <PanelFooter>
          <SaveButton
            label="Change password"
            loadingLabel="Changing password..."
            isLoading={isSaving}
            icon={KeyRound}
          />
        </PanelFooter>
      </form>
    </SettingsPanel>
  );
}

function CollectionSettings({
  preferences,
  addresses,
  isSaving,
  onChange,
  onSave,
}: {
  preferences: CollectionPreferences;
  addresses: AddressOption[];
  isSaving: boolean;
  onChange: (preferences: CollectionPreferences) => void;
  onSave: () => void;
}) {
  return (
    <SettingsPanel
      eyebrow="Collection"
      title="Pickup preferences"
      description="Set defaults that can be used to prefill future waste pickup requests."
      icon={Package}
    >
      <div>
        <FieldHeading
          title="Preferred pickup period"
          description="Your preferred time will be selected automatically on new requests."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {pickupPeriods.map((period) => {
            const selected =
              preferences.preferredPickupPeriod === period.value;

            return (
              <button
                key={period.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...preferences,
                    preferredPickupPeriod: period.value,
                  })
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-green-600 bg-green-50 ring-4 ring-green-600/10"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <Clock3
                  size={20}
                  className={
                    selected
                      ? "text-green-700"
                      : "text-gray-400"
                  }
                />

                <p className="mt-3 text-sm font-black text-gray-950">
                  {period.label}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {period.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="defaultQuantityUnit"
            className="text-sm font-bold text-gray-800"
          >
            Default quantity unit
          </label>

          <select
            id="defaultQuantityUnit"
            value={preferences.defaultQuantityUnit}
            onChange={(event) =>
              onChange({
                ...preferences,
                defaultQuantityUnit: event.target
                  .value as QuantityUnit,
              })
            }
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
          >
            {quantityUnits.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="defaultAddress"
            className="text-sm font-bold text-gray-800"
          >
            Default pickup address
          </label>

          <select
            id="defaultAddress"
            value={preferences.defaultAddressId}
            disabled={addresses.length === 0}
            onChange={(event) =>
              onChange({
                ...preferences,
                defaultAddressId: event.target.value,
              })
            }
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition disabled:cursor-not-allowed disabled:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
          >
            {addresses.length === 0 ? (
              <option value="">No saved addresses</option>
            ) : (
              <>
                <option value="">Select an address</option>

                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} — {address.formatted}
                  </option>
                ))}
              </>
            )}
          </select>

          {addresses.length === 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
              <MapPin size={14} />
              Add an address before selecting a default.
            </p>
          )}
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="pickupInstructions"
            className="text-sm font-bold text-gray-800"
          >
            Default pickup instructions
          </label>

          <span className="text-xs text-gray-400">
            {preferences.pickupInstructions.length}/300
          </span>
        </div>

        <textarea
          id="pickupInstructions"
          rows={5}
          maxLength={300}
          value={preferences.pickupInstructions}
          onChange={(event) =>
            onChange({
              ...preferences,
              pickupInstructions: event.target.value,
            })
          }
          placeholder="For example: Use the side entrance and collect the bags beside the green gate."
          className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
        />
      </div>

      <PanelFooter>
        <SaveButton
          label="Save preferences"
          loadingLabel="Saving preferences..."
          isLoading={isSaving}
          onClick={onSave}
        />
      </PanelFooter>
    </SettingsPanel>
  );
}

function NotificationSettings({
  preferences,
  isSaving,
  onChange,
  onSave,
}: {
  preferences: NotificationPreferences;
  isSaving: boolean;
  onChange: (preferences: NotificationPreferences) => void;
  onSave: () => void;
}) {
  const notificationOptions: {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      key: "emailNotifications",
      label: "Email notifications",
      description:
        "Receive important collection and account updates by email.",
      icon: Mail,
    },
    {
      key: "smsNotifications",
      label: "SMS notifications",
      description:
        "Receive time-sensitive pickup updates by text message.",
      icon: Bell,
    },
    {
      key: "pickupReminders",
      label: "Pickup reminders",
      description:
        "Get a reminder before a scheduled collection window.",
      icon: Clock3,
    },
    {
      key: "statusUpdates",
      label: "Request status updates",
      description:
        "Be notified when a request is approved, assigned or completed.",
      icon: Bell,
    },
    {
      key: "paymentUpdates",
      label: "Payment updates",
      description:
        "Receive payment confirmations, failures and refund notices.",
      icon: Mail,
    },
  ];

  return (
    <SettingsPanel
      eyebrow="Notifications"
      title="Communication preferences"
      description="Choose which updates you want to receive and how they should be delivered."
      icon={Bell}
    >
      <div className="divide-y divide-gray-100">
        {notificationOptions.map((option) => {
          const Icon = option.icon;

          return (
            <div
              key={option.key}
              className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-gray-950">
                  {option.label}
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {option.description}
                </p>
              </div>

              <ToggleSwitch
                checked={preferences[option.key]}
                label={option.label}
                onChange={(checked) =>
                  onChange({
                    ...preferences,
                    [option.key]: checked,
                  })
                }
              />
            </div>
          );
        })}
      </div>

      <PanelFooter>
        <SaveButton
          label="Save notifications"
          loadingLabel="Saving notifications..."
          isLoading={isSaving}
          onClick={onSave}
        />
      </PanelFooter>
    </SettingsPanel>
  );
}

function AccountSettings({
  onDelete,
}: {
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsPanel
        eyebrow="Your data"
        title="Account information"
        description="Download a copy of the personal information associated with your account."
        icon={FileDown}
      >
        <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileDown size={21} />
            </div>

            <div>
              <p className="font-black text-gray-950">
                Download your information
              </p>

              <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                Request a copy of your profile information, addresses,
                pickup requests and payment history.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
          >
            Request download
          </button>
        </div>
      </SettingsPanel>

      <section className="overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
        <div className="border-b border-red-100 bg-red-50/60 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
              <Trash2 size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                Danger zone
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-950">
                Delete account
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Permanently remove your resident account and personal
                information. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="font-black text-gray-950">
              Permanently delete this account
            </p>

            <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
              Existing records that must be retained for operational
              or legal reasons may be anonymised instead of removed
              immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="border-b border-gray-100 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
            <Icon size={22} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-2xl font-black text-gray-950">
              {title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

function ProfileAvatar({
  image,
  name,
  size,
}: {
  image: string | null;
  name: string;
  size: "small" | "large";
}) {
  const dimensions =
    size === "large" ? "h-24 w-24" : "h-12 w-12";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-green-100 ${dimensions}`}
    >
      {image ? (
        <Image
          src={image}
          alt={name || "User profile"}
          fill
          unoptimized
          sizes={size === "large" ? "96px" : "48px"}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-black text-green-800">
          {initials}
        </div>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-bold text-gray-800"
      >
        {label}
      </label>

      <div className="relative mt-2">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:bg-white focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
              : "border-gray-200 focus:border-green-600 focus:ring-green-600/10"
          }`}
        />
      </div>

      <FieldError message={error} />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  error,
  visible,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-bold text-gray-800"
      >
        {label}
      </label>

      <div className="relative mt-2">
        <LockKeyhole
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border bg-gray-50 py-3.5 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition focus:bg-white focus:ring-4 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
              : "border-gray-200 focus:border-green-600 focus:ring-green-600/10"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <FieldError message={error} />
    </div>
  );
}

function FieldHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-gray-950">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <AlertCircle size={14} />
      {message}
    </p>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertCircle size={19} className="mt-0.5 shrink-0" />

      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function PanelFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
      {children}
    </div>
  );
}

function SaveButton({
  label,
  loadingLabel,
  isLoading,
  icon: Icon = Save,
  onClick,
}: {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  icon?: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon size={17} />
          {label}
        </>
      )}
    </button>
  );
}

function ToggleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-green-700" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function DeleteAccountModal({
  confirmation,
  isDeleting,
  onConfirmationChange,
  onClose,
  onDelete,
}: {
  confirmation: string;
  isDeleting: boolean;
  onConfirmationChange: (value: string) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const canDelete = confirmation === "DELETE";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={22} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close delete account modal"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-account-title"
          className="mt-5 text-2xl font-black text-gray-950"
        >
          Permanently delete account?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Your personal profile and access to the resident portal will
          be permanently removed. This action cannot be undone.
        </p>

        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-800">
            Type DELETE to confirm
          </p>

          <input
            type="text"
            value={confirmation}
            disabled={isDeleting}
            onChange={(event) =>
              onConfirmationChange(event.target.value)
            }
            placeholder="DELETE"
            className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          />
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Keep account
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete || isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Deleting account...
              </>
            ) : (
              <>
                <Trash2 size={17} />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}