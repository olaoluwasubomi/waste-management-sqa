"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
  Clock3,
  UserCheck,
  Truck,
  ChevronRight,
  MapPin,
  CalendarDays,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

type FilterStatus = "ALL" | RequestStatus;

interface WasteRequest {
  id: string;
  reference: string;
  description: string | null;

  quantity: number;
  quantityUnit: string;

  status: RequestStatus;

  requestedPickupDate: string;
  scheduledPickupStart: string | null;
  scheduledPickupEnd: string | null;

  createdAt: string;
  updatedAt: string;

  resident: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    image: string | null;
  };

  wasteType: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
  };

  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    formatted: string;
  };

  collector: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    image: string | null;

    collectorProfile: {
      zone: string;
      isActive: boolean;
      vehicleRegistration: string | null;
    } | null;
  } | null;

  payment: {
    id: string;
    amount: number;
    status: string;
    transactionRef: string | null;
  } | null;
}

interface RequestStats {
  totalRequests: number;
  pendingReview: number;
  awaitingAssignment: number;
  activeCollections: number;

  pending: number;
  approved: number;
  assigned: number;
  inProgress: number;
  completed: number;
  canceled: number;
  rejected: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AdminRequestsResponse {
  success: boolean;

  requests?: WasteRequest[];

  stats?: RequestStats;

  pagination?: Pagination;

  filters?: {
    status: RequestStatus | null;
    search: string | null;
    order: "asc" | "desc";
  };

  error?: string;
}

const tabs: {
  label: string;
  value: FilterStatus;
}[] = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Approved",
    value: "APPROVED",
  },
  {
    label: "Assigned",
    value: "ASSIGNED",
  },
  {
    label: "In Progress",
    value: "IN_PROGRESS",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Cancelled",
    value: "CANCELED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
];

const initialStats: RequestStats = {
  totalRequests: 0,
  pendingReview: 0,
  awaitingAssignment: 0,
  activeCollections: 0,

  pending: 0,
  approved: 0,
  assigned: 0,
  inProgress: 0,
  completed: 0,
  canceled: 0,
  rejected: 0,
};

const initialPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function getStatusStyle(status: RequestStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "APPROVED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "ASSIGNED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "IN_PROGRESS":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";

    case "CANCELED":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatStatus(status: RequestStatus) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getTabCount(
  tab: FilterStatus,
  stats: RequestStats,
) {
  switch (tab) {
    case "ALL":
      return stats.totalRequests;

    case "PENDING":
      return stats.pending;

    case "APPROVED":
      return stats.approved;

    case "ASSIGNED":
      return stats.assigned;

    case "IN_PROGRESS":
      return stats.inProgress;

    case "COMPLETED":
      return stats.completed;

    case "CANCELED":
      return stats.canceled;

    case "REJECTED":
      return stats.rejected;
  }
}

export default function AdminRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<
    WasteRequest[]
  >([]);

  const [stats, setStats] =
    useState<RequestStats>(initialStats);

  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);

  const [activeTab, setActiveTab] =
    useState<FilterStatus>("ALL");

  const [search, setSearch] = useState("");

  
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

 
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);


  useEffect(() => {
    const controller = new AbortController();

    async function fetchRequests() {
      try {
        setIsLoading(true);
        setError(null);

        const searchParams =
          new URLSearchParams();

        searchParams.set(
          "page",
          String(page),
        );

        searchParams.set(
          "limit",
          "20",
        );

        searchParams.set(
          "order",
          "desc",
        );

        if (activeTab !== "ALL") {
          searchParams.set(
            "status",
            activeTab,
          );
        }

        if (debouncedSearch) {
          searchParams.set(
            "search",
            debouncedSearch,
          );
        }

        const response = await fetch(
          `/api/admin/get-requests?${searchParams.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as AdminRequestsResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              "Unable to load pickup requests",
          );
        }

        setRequests(
          result.requests ?? [],
        );

        setStats(
          result.stats ??
            initialStats,
        );

        setPagination(
          result.pagination ??
            initialPagination,
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "FETCH ADMIN REQUESTS ERROR:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load pickup requests",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void fetchRequests();

    return () => {
      controller.abort();
    };
  }, [
    activeTab,
    debouncedSearch,
    page,
  ]);

  function handleTabChange(
    status: FilterStatus,
  ) {
    setActiveTab(status);
    setPage(1);
  }

  function handleRefresh() {
   
    window.location.reload();
  }

  function openRequest(
    requestId: string,
  ) {
  
    router.push(
      `/admin/request-management/${requestId}`,
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Request Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review pickup requests, approve
              collections and assign collectors.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Requests"
            value={stats.totalRequests}
            description="All pickup requests"
            icon={
              <ClipboardList size={21} />
            }
          />

          <SummaryCard
            title="Pending Review"
            value={stats.pendingReview}
            description="Waiting for admin review"
            icon={<Clock3 size={21} />}
          />

          <SummaryCard
            title="Awaiting Assignment"
            value={
              stats.awaitingAssignment
            }
            description="Approved requests"
            icon={
              <UserCheck size={21} />
            }
          />

          <SummaryCard
            title="Active Collections"
            value={
              stats.activeCollections
            }
            description="Assigned or in progress"
            icon={<Truck size={21} />}
          />
        </div>

        {/* Main request table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Search */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search reference, resident, waste type, location..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto border-b border-gray-200">
            <div className="flex min-w-max px-4">
              {tabs.map((tab) => {
                const active =
                  activeTab ===
                  tab.value;

                const count =
                  getTabCount(
                    tab.value,
                    stats,
                  );

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() =>
                      handleTabChange(
                        tab.value,
                      )
                    }
                    className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                      active
                        ? "border-green-600 text-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && !isLoading && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load
                    requests
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={34}
                  className="mx-auto animate-spin text-green-700"
                />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  Loading pickup
                  requests...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              {requests.length > 0 && (
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 text-left">
                        <TableHeading>
                          Request
                        </TableHeading>

                        <TableHeading>
                          Resident
                        </TableHeading>

                        <TableHeading>
                          Waste
                        </TableHeading>

                        <TableHeading>
                          Pickup
                        </TableHeading>

                        <TableHeading>
                          Status
                        </TableHeading>

                        <TableHeading>
                          Collector
                        </TableHeading>

                        <TableHeading>
                          Action
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {requests.map(
                        (
                          request,
                        ) => (
                          <tr
                            key={
                              request.id
                            }
                            className="transition hover:bg-gray-50"
                          >
                            {/* Request */}
                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap font-semibold text-gray-900">
                                {
                                  request.reference
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Submitted{" "}
                                {formatDate(
                                  request.createdAt,
                                )}
                              </p>
                            </td>

                            {/* Resident */}
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">
                                {
                                  request
                                    .resident
                                    .fullName
                                }
                              </p>

                              <p className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                                {
                                  request
                                    .resident
                                    .email
                                }
                              </p>
                            </td>

                            {/* Waste */}
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-2">
                                <Package
                                  size={
                                    17
                                  }
                                  className="mt-0.5 shrink-0 text-gray-400"
                                />

                                <div>
                                  <p className="font-medium text-gray-900">
                                    {
                                      request
                                        .wasteType
                                        .name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {
                                      request.quantity
                                    }{" "}
                                    {
                                      request.quantityUnit
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Pickup */}
                            <td className="px-5 py-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <CalendarDays
                                    size={
                                      15
                                    }
                                    className="shrink-0 text-gray-400"
                                  />

                                  {formatDate(
                                    request.requestedPickupDate,
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <MapPin
                                    size={
                                      14
                                    }
                                    className="shrink-0"
                                  />

                                  <span className="max-w-[180px] truncate">
                                    {
                                      request
                                        .pickupAddress
                                        .city
                                    }
                                    ,{" "}
                                    {
                                      request
                                        .pickupAddress
                                        .state
                                    }
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                  request.status,
                                )}`}
                              >
                                {formatStatus(
                                  request.status,
                                )}
                              </span>
                            </td>

                            {/* Collector */}
                            <td className="px-5 py-4">
                              {request.collector ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {
                                      request
                                        .collector
                                        .fullName
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    {request
                                      .collector
                                      .collectorProfile
                                      ?.zone ??
                                      "Assigned"}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Not
                                  assigned
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openRequest(
                                    request.id,
                                  )
                                }
                                className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-green-700 transition hover:text-green-800"
                              >
                                View

                                <ChevronRight
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile */}
              {requests.length > 0 && (
                <div className="divide-y divide-gray-100 lg:hidden">
                  {requests.map(
                    (request) => (
                      <button
                        type="button"
                        key={
                          request.id
                        }
                        onClick={() =>
                          openRequest(
                            request.id,
                          )
                        }
                        className="block w-full p-4 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {
                                request.reference
                              }
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              {
                                request
                                  .resident
                                  .fullName
                              }
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              request.status,
                            )}`}
                          >
                            {formatStatus(
                              request.status,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <MobileField
                            label="Waste"
                            value={`${request.wasteType.name} · ${request.quantity} ${request.quantityUnit}`}
                          />

                          <MobileField
                            label="Pickup Date"
                            value={formatDate(
                              request.requestedPickupDate,
                            )}
                          />

                          <MobileField
                            label="Location"
                            value={`${request.pickupAddress.city}, ${request.pickupAddress.state}`}
                          />

                          <MobileField
                            label="Collector"
                            value={
                              request.collector
                                ?.fullName ??
                              "Not assigned"
                            }
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-green-700">
                          View Request

                          <ChevronRight
                            size={16}
                          />
                        </div>
                      </button>
                    ),
                  )}
                </div>
              )}

              {/* Empty state */}
              {requests.length ===
                0 &&
                !error && (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <ClipboardList
                        size={25}
                      />
                    </div>

                    <h3 className="mt-4 font-semibold text-gray-900">
                      No requests
                      found
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                      {activeTab !==
                      "ALL"
                        ? `There are currently no ${formatStatus(
                            activeTab,
                          ).toLowerCase()} pickup requests.`
                        : debouncedSearch
                          ? "No pickup requests match your search."
                          : "No pickup requests have been submitted yet."}
                    </p>
                  </div>
                )}
            </>
          )}

          {/* Pagination footer */}
          {!isLoading &&
            requests.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing page{" "}
                  <span className="font-medium text-gray-700">
                    {
                      pagination.page
                    }
                  </span>

                  {pagination.totalPages >
                    0 && (
                    <>
                      {" "}
                      of{" "}
                      <span className="font-medium text-gray-700">
                        {
                          pagination.totalPages
                        }
                      </span>
                    </>
                  )}

                  {" · "}

                  <span className="font-medium text-gray-700">
                    {
                      pagination.total
                    }
                  </span>{" "}
                  matching request
                  {pagination.total !==
                  1
                    ? "s"
                    : ""}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            current -
                              1,
                            1,
                          ),
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={16}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current +
                          1,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function MobileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}