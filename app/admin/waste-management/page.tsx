"use client"
import { useState, useEffect } from "react";
import WasteStats from "./components/WasteStats";
import WasteFilters from "./components/WasteFilters";
import WasteTable from "./components/WasteTable";
import api from "@/lib/api";
import { useRefreshSignal } from "@/lib/useRefresh";

type WasteType = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  status: "ACTIVE" | "INACTIVE";
};

export default function WasteManagementPage() {
    const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
    const [loading, setLoading] = useState(false);
    const refresh = useRefreshSignal();
    const [refreshKey, setRefreshKey] = useState(0);
    const [openCreateWaste, setOpenCreateWaste] = useState(false);

    const getWasteTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/get-wastetypes");
            setWasteTypes(res.data);
        } catch (error) {
            console.log("Failed to fetch waste types");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getWasteTypes();
    }, [refresh]);

    return (
        <div>
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold">Waste Management</h2>
                <p className="text-gray-500">Manage all waste types in the system</p>
            </div>
            <WasteStats refreshKey={refresh} />
            <div className="mt-6">
                <WasteFilters />
            </div>
            <div className="mt-10">
                {loading ? (
                    <p className="mt-10">Loading waste types...</p>
                    ) : (
                     <WasteTable data={wasteTypes} />
                )}
            </div>
        </div>
    )
}