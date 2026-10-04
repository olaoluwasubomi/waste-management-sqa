"use client";

import { useEffect, useState } from "react";
import { UserRow } from "./columns";

interface Props {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
}

export default function EditUserModal({ user, open, onClose }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.name || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="border p-2 rounded col-span-2"
          />

          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}