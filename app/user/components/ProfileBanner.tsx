import Link from "next/link";
import { MapPin } from "lucide-react";

interface ProfileBannerProps {
  hasAddress: boolean;
}

export default function ProfileBanner({ hasAddress }: ProfileBannerProps) {
  if (hasAddress) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">
            Add your pickup address
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            You need at least one address before you can schedule a waste
            pickup.
          </p>
        </div>
      </div>

      <Link
        href="/user/addresses"
        className="
          bg-green-600 hover:bg-green-700
          text-white text-sm font-medium
          px-4 py-2 rounded-lg
          shadow-md transition
          text-center shrink-0
        "
      >
        Add Address
      </Link>
    </div>
  );
}
