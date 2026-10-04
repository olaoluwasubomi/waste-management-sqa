"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { triggerRefresh } from "@/lib/useRefresh";
import { useRefreshSignal } from "@/lib/useRefresh";
import AdminPageHeader from "@/app/admin/components/AdminHeader";
import AddressCard from "./components/AddressCard";
import AddressFormModal from "./components/AddressFormModal";
import { UserAddress } from "./types";

export default function AddressesPageContent() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const refresh = useRefreshSignal();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/user/addresses");
      setAddresses(response.data);
    } catch (error) {
      console.error("Failed to fetch addresses", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [refresh]);

  const handleAdd = () => {
    setSelectedAddress(null);
    setModalOpen(true);
  };

  const handleEdit = (address: UserAddress) => {
    setSelectedAddress(address);
    setModalOpen(true);
  };

  const handleDelete = async (address: UserAddress) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );
    if (!confirmed) return;

    setDeletingId(address.id);
    try {
      await api.delete(`/user/addresses/${address.id}`);
      toast.success("Address deleted successfully");
      triggerRefresh();
      await fetchAddresses();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to delete address";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Addresses"
        subtitle="Manage your pickup locations for waste collection."
        buttonLabel="Add Address"
        onButtonClick={handleAdd}
      />

      {loading ? (
        <p className="text-gray-500">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No addresses saved yet
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            Add your home or business address so collectors know where to pick up
            your waste.
          </p>
          <button
            onClick={handleAdd}
            className="
              mt-6 bg-green-600 hover:bg-green-700
              text-white text-sm font-medium
              px-5 py-2.5 rounded-lg shadow-md transition
            "
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deletingId === address.id}
            />
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAddress(null);
        }}
        address={selectedAddress}
        onSuccess={fetchAddresses}
      />
    </div>
  );
}
