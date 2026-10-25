"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useAdminProfile } from "../context/AdminProfileContext";

type SettingsState = {
	fullName: string;
	email: string;
	password: string;
	profileImage: string;
	defaultPickupFrequency: string;
	timezone: string;
	notificationEmail: boolean;
	notificationSms: boolean;
	requireTwoFactor: boolean;
};

const initialSettings: SettingsState = {
	fullName: "",
	email: "",
	password: "",
	profileImage: "",
	defaultPickupFrequency: "Weekly",
	timezone: "UTC",
	notificationEmail: true,
	notificationSms: false,
	requireTwoFactor: false,
};



export default function SettingsPage() {
	const { data: session , update } = useSession();
	const [settings, setSettings] = useState<SettingsState>(initialSettings);
	const [saved, setSaved] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	// const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	// const [isLoadingProfile, setIsLoadingProfile] = useState(false);
	const {
	profile,
	isLoadingProfile,
	isUpdatingProfile,
	profileError,
	updateProfile,
} = useAdminProfile();

	useEffect(() => {
		if (session?.user) {
			void fetchProfile();
		}
	}, [session?.user?.email]);

	const handleChange = (key: keyof SettingsState, value: string | boolean) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	};

	const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setSelectedImageFile(file);

		setSettings((prev) => ({
			...prev,
			profileImage: URL.createObjectURL(file),
		}));

		setSaved(false);
		setError("");
	};

	const fetchProfile = async () => {
		try {
			// setIsLoadingProfile(true);
			setError("");

			const response = await fetch("/api/admin/update-profile", {
				method: "GET",
				cache: "no-store",
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Unable to retrieve profile");
			}

			setSettings((prev) => ({
				...prev,
				fullName: `${result.user.firstName} ${result.user.lastName}`.trim(),
				email: result.user.email ?? "",
				profileImage: result.user.image ?? "",
				password: "",
			}));
		} catch (error) {
			console.error("FETCH PROFILE ERROR:", error);
			setError("Unable to load your profile details.");
		} finally {
			// setIsLoadingProfile(false);
		}
	};
	

	// const handleSave = async () => {
	// 	try {
	// 		setIsSaving(true);
	// 		setSaved(false);
	// 		setError("");

	// 		const formData = new FormData();

	// 		formData.append("fullName", settings.fullName.trim());
	// 		formData.append("email", settings.email.trim());

	// 		if (settings.password.trim()) {
	// 			formData.append("password", settings.password);
	// 		}

	// 		if (selectedImageFile) {
	// 			formData.append("profileImage", selectedImageFile);
	// 		}

	// 		const response = await fetch("/api/admin/update-profile", {
	// 			method: "POST",
	// 			body: formData,
	// 		});

	// 		const result = await response.json();

	// 		if (!response.ok) {
	// 			throw new Error(result.error || "Failed to update profile");
	// 		}

	// 		const updatedFullName =
	// 			`${result.user.firstName} ${result.user.lastName}`.trim();

	// 		setSettings((prev) => ({
	// 			...prev,
	// 			fullName: updatedFullName,
	// 			email: result.user.email ?? "",
	// 			password: "",
	// 			profileImage: result.user.image ?? "",
	// 		}));

	// 		setSelectedImageFile(null);
	// 		setShowPassword(false);
	// 		setSaved(true);

	// 		await fetchProfile();
	// 	} catch (error) {
	// 		console.error("SAVE PROFILE ERROR:", error);

	// 		setError(
	// 			error instanceof Error
	// 				? error.message
	// 				: "Unable to save settings. Please try again."
	// 		);
	// 	} finally {
	// 		setIsSaving(false);
	// 	}
	// };


	const handleSave = async () => {
	try {
		setSaved(false);
		setError("");

		const updatedUser = await updateProfile({
			fullName: settings.fullName,
			email: settings.email,
			password: settings.password,
			profileImage: selectedImageFile,
		});

		const updatedFullName =
			`${updatedUser.firstName} ${updatedUser.lastName}`.trim();

		setSettings((prev) => ({
			...prev,
			fullName: updatedFullName,
			email: updatedUser.email ?? "",
			password: "",
			profileImage: updatedUser.image ?? "",
		}));

		setSelectedImageFile(null);
		setShowPassword(false);
		setSaved(true);
	} catch (error) {
		console.error("SAVE PROFILE ERROR:", error);

		setError(
			error instanceof Error
				? error.message
				: "Unable to save settings. Please try again."
		);
	}
};
	

	if (isLoadingProfile) {
		return (
			<div className="flex min-h-[300px] items-center justify-center">
				<p className="text-sm text-gray-500">
					Loading profile settings...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="mb-2">
				<h1 className="text-3xl font-semibold">Admin Settings</h1>
				<p className="text-sm text-gray-600 mt-1">
					Manage your account details, notification preferences, and admin security settings.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left: compact profile card */}
				<section className="col-span-1 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
					<h2 className="text-xl font-semibold">Profile</h2>
					<p className="text-sm text-gray-500 mt-1">Update your admin profile and photo.</p>

					<div className="mt-6 space-y-4">
						<div className="flex items-center gap-4">
							<div className="h-24 w-24 overflow-hidden rounded-3xl bg-gray-100">
								{settings.profileImage ? (
									<img src={settings.profileImage} alt="Profile" className="h-full w-full object-cover" />
								) : (
									<div className="grid h-full w-full place-items-center text-gray-400">Photo</div>
								)}
							</div>
						</div>

						<label className="block">
							<span className="text-sm font-medium text-gray-700">Name</span>
							<input
								type="text"
								value={settings.fullName}
								onChange={(e) => handleChange("fullName", e.target.value)}
								className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 focus:border-green-500 focus:outline-none"
							/>
						</label>

						<label className="block">
							<span className="text-sm font-medium text-gray-700">Email</span>
							<input
								type="email"
								value={settings.email}
								onChange={(e) => handleChange("email", e.target.value)}
								className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 focus:border-green-500 focus:outline-none"
							/>
						</label>

						<label className="block">
							<span className="text-sm font-medium text-gray-700">Change password</span>

							<div className="mt-2 flex gap-2">
								<input
								type={showPassword ? "text" : "password"}
								value={settings.password}
								onChange={(e) => handleChange("password", e.target.value)}
								placeholder="••••••••"
								className="block flex-1 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 focus:border-green-500 focus:outline-none"
								/>

								<button
								type="button"
								onClick={() => setShowPassword((s) => !s)}
								className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
								>
								{showPassword ? "Hide" : "Show"}
								</button>
							</div>

							<p className="text-xs text-gray-400 mt-1">
								Enter a new password only if you want to change the current password.
							</p>
						</label>

						<label className="cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 inline-block">
							Upload image
							<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
						</label>
					</div>
				</section>

				{/* Right: stacked settings */}
				<div className="col-span-2 space-y-6">
					<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold">System Defaults</h2>
						<p className="text-sm text-gray-500 mt-1">Set default preferences for the waste management portal.</p>

						<div className="mt-6 space-y-4">
							<label className="block">
								<span className="text-sm font-medium text-gray-700">Pickup Frequency</span>
								<select
									value={settings.defaultPickupFrequency}
									onChange={(e) => handleChange("defaultPickupFrequency", e.target.value)}
									className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 focus:border-green-500 focus:outline-none"
								>
									<option>Daily</option>
									<option>Weekly</option>
									<option>Biweekly</option>
									<option>Monthly</option>
								</select>
							</label>

							<label className="block">
								<span className="text-sm font-medium text-gray-700">Timezone</span>
								<select
									value={settings.timezone}
									onChange={(e) => handleChange("timezone", e.target.value)}
									className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 focus:border-green-500 focus:outline-none"
								>
									<option>UTC</option>
									<option>GMT</option>
									<option>America/New_York</option>
									<option>Asia/Accra</option>
								</select>
							</label>
						</div>
					</section>

					<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold">Security</h2>
						<p className="text-sm text-gray-500 mt-1">Manage account security and authentication options.</p>

						<div className="mt-6 space-y-4">
							<label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
								<input
									type="checkbox"
									checked={settings.requireTwoFactor}
									onChange={(e) => handleChange("requireTwoFactor", e.target.checked)}
									className="h-5 w-5 text-green-600"
								/>
								<div>
									<p className="text-sm font-medium text-gray-700">Require two-factor authentication</p>
									<p className="text-sm text-gray-500">Add an extra layer of login protection.</p>
								</div>
							</label>
						</div>
					</section>

					<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold">Notification Settings</h2>
						<p className="text-sm text-gray-500 mt-1">Choose how you receive system alerts.</p>

						<div className="mt-6 space-y-4">
							<label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
								<input
									type="checkbox"
									checked={settings.notificationEmail}
									onChange={(e) => handleChange("notificationEmail", e.target.checked)}
									className="h-5 w-5 text-green-600"
								/>
								<span className="text-sm text-gray-700">Email notifications</span>
							</label>

							<label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
								<input
									type="checkbox"
									checked={settings.notificationSms}
									onChange={(e) => handleChange("notificationSms", e.target.checked)}
									className="h-5 w-5 text-green-600"
								/>
								<span className="text-sm text-gray-700">SMS notifications</span>
							</label>
						</div>
					</section>

					<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold">Save Settings</h2>
						<p className="text-sm text-gray-500 mt-1">Persist your changes to the admin profile and system preferences.</p>

						<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
							<button
								type="button"
								onClick={handleSave}
								disabled={isUpdatingProfile}
								className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
							>
								{isUpdatingProfile ? "Saving..." : "Save changes"}
							</button>
							{saved && (
								<p className="text-sm text-green-700">
									Settings saved successfully.
								</p>
							)}

							{(error || profileError) && (
								<p className="text-sm text-red-600">
									{error || profileError}
								</p>
							)}

						</div>
					</section>
				</div>
			</div>

		</div>
	);
}
