"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import { UserAddress, formatAddressLine } from "../types";

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (address: UserAddress) => void;
  deleting?: boolean;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  deleting,
}: AddressCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900">{address.street}</h4>
          <p className="text-sm text-gray-600 mt-1 break-words">
            {formatAddressLine(address)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onEdit(address)}
          className="
            flex items-center gap-1.5 text-sm font-medium
            text-gray-600 hover:text-green-700 transition
          "
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(address)}
          disabled={deleting}
          className="
            flex items-center gap-1.5 text-sm font-medium
            text-gray-600 hover:text-red-600 transition
            disabled:opacity-50
          "
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
