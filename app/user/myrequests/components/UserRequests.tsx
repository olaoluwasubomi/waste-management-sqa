"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  History,
  Home,
  Laptop,
  Leaf,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Recycle,
  Search,
  Trash2,
  Truck,
  UserRound,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

type RequestView = "UPCOMING" | "WAITING" | "HISTORY";

interface PickupRequest {
  id: string;
  reference: string;
  wasteType: string;
  pickupAddress: string;
  preferredDate: string;
  createdAt: string;
  status: RequestStatus;
  collectorName: string | null;
  collectionWindow: string | null;
  notes: string | null;
}

interface ApiActivity {
  id: string;
  type: string;
  status: RequestStatus | null;
  title: string;
  description: string | null;
  createdAt: string;
}

interface ApiWasteRequest {
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

  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    formatted: string;
  };

  wasteType: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    imageUrl: string | null;
  };

  collector: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    image: string | null;

    collectorProfile: {
      zone: string | null;
      vehicleRegistration: string | null;
    } | null;
  } | null;

  activities: ApiActivity[];
}

interface RequestsApiResponse {
  success: boolean;
  requests?: ApiWasteRequest[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  error?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  status: RequestStatus;
  createdAt: string;
}

const statusLabels: Record<RequestStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  ASSIGNED: "Collector assigned",
  IN_PROGRESS: "Collection in progress",
  COMPLETED: "Completed",
  CANCELED: "Cancelled",
  REJECTED: "Rejected",
};

const statusStyles: Record<RequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  ASSIGNED:
    "bg-violet-50 text-violet-700 border-violet-200",
  IN_PROGRESS:
    "bg-cyan-50 text-cyan-700 border-cyan-200",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED: "bg-gray-100 text-gray-600 border-gray-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const requestViewOptions: {
  label: string;
  value: RequestView;
  description: string;
}[] = [
  {
    label: "Upcoming",
    value: "UPCOMING",
    description: "Assigned and active collections",
  },
  {
    label: "Waiting",
    value: "WAITING",
    description: "Requests awaiting action",
  },
  {
    label: "History",
    value: "HISTORY",
    description: "Past and closed requests",
  },
];

const progressStages = [
  "Requested",
  "Reviewed",
  "Assigned",
  "Collection",
  "Completed",
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

function formatCollectionWindow(
  start: string | null,
  end: string | null,
) {
  if (!start && !end) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (start && end) {
    return `${formatter.format(
      new Date(start),
    )} – ${formatter.format(new Date(end))}`;
  }

  const availableDate = start ?? end;

  return availableDate
    ? formatter.format(new Date(availableDate))
    : null;
}

function formatActivityTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusStep(status: RequestStatus) {
  const steps: Record<RequestStatus, number> = {
    PENDING: 1,
    APPROVED: 2,
    ASSIGNED: 3,
    IN_PROGRESS: 4,
    COMPLETED: 5,
    CANCELED: 1,
    REJECTED: 1,
  };

  return steps[status];
}

function getRequestView(
  status: RequestStatus,
): RequestView {
  if (
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  ) {
    return "UPCOMING";
  }

  if (
    status === "PENDING" ||
    status === "APPROVED"
  ) {
    return "WAITING";
  }

  return "HISTORY";
}

function getWasteIcon(wasteType: string) {
  const normalized = wasteType.toLowerCase();

  if (normalized.includes("garden")) {
    return Leaf;
  }

  if (
    normalized.includes("electronic") ||
    normalized.includes("e-waste")
  ) {
    return Laptop;
  }

  if (
    normalized.includes("plastic") ||
    normalized.includes("recycl")
  ) {
    return Recycle;
  }

  return Home;
}

function getWasteAccent(wasteType: string) {
  const normalized = wasteType.toLowerCase();

  if (normalized.includes("garden")) {
    return "bg-lime-50 text-lime-700";
  }

  if (
    normalized.includes("electronic") ||
    normalized.includes("e-waste")
  ) {
    return "bg-indigo-50 text-indigo-700";
  }

  if (normalized.includes("plastic")) {
    return "bg-sky-50 text-sky-700";
  }

  if (normalized.includes("recycl")) {
    return "bg-teal-50 text-teal-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function MyRequests() {
  const router = useRouter();

  const [requests, setRequests] = useState<
    PickupRequest[]
  >([]);

  const [activities, setActivities] = useState<
    ActivityItem[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [selectedView, setSelectedView] =
    useState<RequestView>("UPCOMING");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [cancelTarget, setCancelTarget] =
    useState<PickupRequest | null>(null);


  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRequests() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          "/api/user/requests?limit=50&order=desc",
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as RequestsApiResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              "Unable to retrieve pickup requests",
          );
        }

        const apiRequests = result.requests ?? [];

        const formattedRequests: PickupRequest[] =
          apiRequests.map((request) => ({
            id: request.id,
            reference: request.reference,
            wasteType: request.wasteType.name,
            pickupAddress:
              request.pickupAddress.formatted,
            preferredDate:
              request.requestedPickupDate,
            createdAt: request.createdAt,
            status: request.status,
            collectorName:
              request.collector?.fullName ?? null,
            collectionWindow:
              formatCollectionWindow(
                request.scheduledPickupStart,
                request.scheduledPickupEnd,
              ),
            notes: request.description,
          }));

        const formattedActivities: ActivityItem[] =
          apiRequests
            .flatMap((request) =>
              request.activities.map(
                (activity) => ({
                  id: activity.id,
                  title: activity.title,
                  description:
                    activity.description ??
                    `Update for request ${request.reference}`,
                  time: formatActivityTime(
                    activity.createdAt,
                  ),
                  status:
                    activity.status ??
                    request.status,
                  createdAt: activity.createdAt,
                }),
              ),
            )
            .sort(
              (first, second) =>
                new Date(
                  second.createdAt,
                ).getTime() -
                new Date(
                  first.createdAt,
                ).getTime(),
            )
            .slice(0, 8);

        setRequests(formattedRequests);
        setActivities(formattedActivities);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "FETCH USER REQUESTS ERROR:",
          fetchError,
        );

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to retrieve pickup requests",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchRequests();

    return () => {
      controller.abort();
    };
  }, []);

  const currentPickup = useMemo(() => {
    const priority: RequestStatus[] = [
      "IN_PROGRESS",
      "ASSIGNED",
      "APPROVED",
      "PENDING",
    ];

    return [...requests]
      .filter((request) =>
        priority.includes(request.status),
      )
      .sort((first, second) => {
        const firstPriority = priority.indexOf(
          first.status,
        );

        const secondPriority = priority.indexOf(
          second.status,
        );

        if (firstPriority !== secondPriority) {
          return firstPriority - secondPriority;
        }

        return (
          new Date(
            first.preferredDate,
          ).getTime() -
          new Date(
            second.preferredDate,
          ).getTime()
        );
      })[0];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return requests.filter((request) => {
      const matchesView =
        getRequestView(request.status) ===
        selectedView;

      const matchesSearch =
        !normalizedSearch ||
        request.reference
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.wasteType
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.pickupAddress
          .toLowerCase()
          .includes(normalizedSearch) ||
        Boolean(
          request.collectorName
            ?.toLowerCase()
            .includes(normalizedSearch),
        );

      return matchesView && matchesSearch;
    });
  }, [requests, searchTerm, selectedView]);

  const summary = useMemo(() => {
    const active = requests.filter((request) =>
      [
        "PENDING",
        "APPROVED",
        "ASSIGNED",
        "IN_PROGRESS",
      ].includes(request.status),
    ).length;

    const now = new Date();

    const completedThisMonth =
      requests.filter((request) => {
        if (request.status !== "COMPLETED") {
          return false;
        }

        const requestDate = new Date(
          request.preferredDate,
        );

        return (
          requestDate.getMonth() ===
            now.getMonth() &&
          requestDate.getFullYear() ===
            now.getFullYear()
        );
      }).length;

    return {
      total: requests.length,
      active,
      completedThisMonth,
    };
  }, [requests]);

  function canEdit(status: RequestStatus) {
    return status === "PENDING";
  }

  function canCancel(status: RequestStatus) {
    return (
      status === "PENDING" ||
      status === "APPROVED"
    );
  }

  async function handleCancelRequest() {
    if (!cancelTarget) {
      return;
    }

    try {
      setIsCancelling(true);
      setCancelError(null);

      const response = await fetch(
        `/api/user/requests/${cancelTarget.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: cancelReason.trim() || undefined,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        request?: {
          id: string;
          status: RequestStatus;
          cancellationReason: string | null;
          canceledAt: string | null;
        };
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Unable to cancel pickup request",
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === cancelTarget.id
            ? {
                ...request,
                status: "CANCELED",
              }
            : request,
        ),
      );

      setActivities((currentActivities) => [
        {
          id: `cancel-${cancelTarget.id}`,
          title: "Pickup request cancelled",
          description:
            cancelReason.trim() ||
            "The pickup request was cancelled by the resident.",
          time: new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
          status: "CANCELED",
          createdAt: new Date().toISOString(),
        },
        ...currentActivities,
      ]);

      setCancelTarget(null);
      setCancelReason("");
      setCancelError(null);
    } catch (error) {
      console.error("CANCEL REQUEST ERROR:", error);

      setCancelError(
        error instanceof Error
          ? error.message
          : "Unable to cancel pickup request",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-[#f4f7f2]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                Collection centre
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                My Collections
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                Follow your collection journey,
                review upcoming pickups and manage
                your requests.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">
                  {summary.total} requests
                </span>

                {" · "}

                {summary.active} active

                {" · "}

                {summary.completedThisMonth}{" "}
                completed this month
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/user/myrequests/newrequests",
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
              >
                <Plus size={18} />
                Request a pickup
              </button>
            </div>
          </header>

          {isLoading ? (
            <LoadingRequests />
          ) : error ? (
            <RequestsError message={error} />
          ) : currentPickup ? (
            <CurrentPickupSpotlight
              request={currentPickup}
              onView={() =>
                router.push(
                  `/user/myrequests/${currentPickup.id}`,
                )
              }
              onEdit={() =>
                router.push(
                  `/user/myrequests/${currentPickup.id}/edit`,
                )
              }
              onCancel={() =>
                setCancelTarget(currentPickup)
              }
              canEdit={canEdit(
                currentPickup.status,
              )}
              canCancel={canCancel(
                currentPickup.status,
              )}
            />
          ) : (
            <NoCurrentPickup
              onCreate={() =>
                router.push(
                  "/user/myrequests/newrequests",
                )
              }
            />
          )}

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0">
              <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                <div className="border-b border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Your request board
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-gray-950">
                          Collection requests
                        </h2>
                      </div>

                      <div className="relative w-full lg:max-w-sm">
                        <Search
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="search"
                          value={searchTerm}
                          onChange={(event) =>
                            setSearchTerm(
                              event.target.value,
                            )
                          }
                          placeholder="Search your requests"
                          className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                        />

                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() =>
                              setSearchTerm("")
                            }
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-gray-100 p-1.5 sm:grid-cols-3">
                      {requestViewOptions.map(
                        (option) => {
                          const selected =
                            selectedView ===
                            option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setSelectedView(
                                  option.value,
                                )
                              }
                              className={`rounded-xl px-4 py-3 text-left transition ${
                                selected
                                  ? "bg-white shadow-sm"
                                  : "hover:bg-white/60"
                              }`}
                            >
                              <span
                                className={`block text-sm font-bold ${
                                  selected
                                    ? "text-green-800"
                                    : "text-gray-700"
                                }`}
                              >
                                {option.label}
                              </span>

                              <span className="mt-0.5 block text-xs text-gray-500">
                                {
                                  option.description
                                }
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {isLoading ? (
                    <RequestListLoading />
                  ) : error ? (
                    <div className="py-12 text-center">
                      <p className="text-sm font-medium text-red-600">
                        {error}
                      </p>
                    </div>
                  ) : filteredRequests.length >
                    0 ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {filteredRequests.map(
                        (request) => (
                          <RequestTicket
                            key={request.id}
                            request={request}
                            canEdit={canEdit(
                              request.status,
                            )}
                            canCancel={canCancel(
                              request.status,
                            )}
                            onView={() =>
                              router.push(
                                `/user/myrequests/${request.id}`,
                              )
                            }
                            onEdit={() =>
                              router.push(
                                `/user/myrequests/${request.id}/edit`,
                              )
                            }
                            onCancel={() =>
                              setCancelTarget(
                                request,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyRequestView
                      view={selectedView}
                      hasSearch={Boolean(
                        searchTerm,
                      )}
                      onClearSearch={() =>
                        setSearchTerm("")
                      }
                      onCreate={() =>
                        router.push(
                          "/user/myrequests/newrequests",
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </section>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <ActivityRail
                activities={activities}
              />
            </aside>
          </div>
        </div>
      </main>

      {cancelTarget && (
        <CancelRequestModal
          request={cancelTarget}
          reason={cancelReason}
          error={cancelError}
          isCancelling={isCancelling}
          onReasonChange={setCancelReason}
          onClose={() => {
            if (isCancelling) {
              return;
            }

            setCancelTarget(null);
            setCancelReason("");
            setCancelError(null);
          }}
          onConfirm={handleCancelRequest}
        />
      )}
    </>
  );
}

function LoadingRequests() {
  return (
    <section className="flex min-h-72 items-center justify-center rounded-[32px] bg-gray-950 text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-green-400" />

        <p className="mt-4 text-sm font-medium text-gray-300">
          Loading your collection requests...
        </p>
      </div>
    </section>
  );
}

function RequestListLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

        <p className="mt-3 text-sm text-gray-500">
          Loading requests...
        </p>
      </div>
    </div>
  );
}

function RequestsError({
  message,
}: {
  message: string;
}) {
  return (
    <section className="rounded-[32px] border border-red-200 bg-red-50 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-600">
        <X size={25} />
      </div>

      <h2 className="mt-5 text-xl font-black text-gray-950">
        Unable to load requests
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        {message}
      </p>

      <button
        type="button"
        onClick={() =>
          window.location.reload()
        }
        className="mt-5 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
      >
        Try again
      </button>
    </section>
  );
}

function CurrentPickupSpotlight({
  request,
  onView,
  onEdit,
  onCancel,
  canEdit,
  canCancel,
}: {
  request: PickupRequest;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  canEdit: boolean;
  canCancel: boolean;
}) {
  const WasteIcon = getWasteIcon(
    request.wasteType,
  );

  const currentStep = getStatusStep(
    request.status,
  );

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gray-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />

      <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-200">
              <Truck size={14} />
              Your next collection
            </span>

            <StatusBadge
              status={request.status}
              dark
            />
          </div>

          <div className="mt-7 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-950">
              <WasteIcon size={27} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-400">
                {request.reference}
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                {request.wasteType}
              </h2>

              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-300">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-green-300"
                />

                {request.pickupAddress}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                <CalendarDays size={15} />
                Collection date
              </div>

              <p className="mt-2 text-lg font-bold text-white">
                {formatLongDate(
                  request.preferredDate,
                )}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {request.collectionWindow ??
                  "Collection window pending"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                <UserRound size={15} />
                Collector
              </div>

              <p className="mt-2 text-lg font-bold text-white">
                {request.collectorName ??
                  "Not assigned yet"}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {request.collectorName
                  ? "Your collector has been confirmed"
                  : "We will notify you when assigned"}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Collection journey
            </p>

            <div className="mt-4 grid grid-cols-5">
              {progressStages.map(
                (stage, index) => {
                  const step = index + 1;
                  const completed =
                    step < currentStep;
                  const current =
                    step === currentStep;
                  const last =
                    index ===
                    progressStages.length - 1;

                  return (
                    <div
                      key={stage}
                      className="relative flex flex-col items-center text-center"
                    >
                      {!last && (
                        <div
                          className={`absolute left-1/2 top-4 h-0.5 w-full ${
                            step <
                            currentStep
                              ? "bg-green-400"
                              : "bg-white/15"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${
                          completed
                            ? "border-green-400 bg-green-400 text-gray-950"
                            : current
                              ? "border-white bg-white text-gray-950"
                              : "border-white/20 bg-gray-950 text-gray-500"
                        }`}
                      >
                        {completed ? (
                          <Check
                            size={15}
                            strokeWidth={3}
                          />
                        ) : current ? (
                          <Circle
                            size={9}
                            fill="currentColor"
                            strokeWidth={0}
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {step}
                          </span>
                        )}
                      </div>

                      <span
                        className={`mt-2 hidden text-[11px] font-medium sm:block ${
                          completed || current
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {stage}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-300">
              Current update
            </p>

            <h3 className="mt-3 text-xl font-bold leading-snug">
              {statusLabels[request.status]}
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-300">
              {getStatusMessage(request)}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={onView}
              className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-green-100"
            >
              View request details
              <ArrowRight size={17} />
            </button>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {canEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Pencil size={16} />
                  Edit request
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Cancel request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RequestTicket({
  request,
  canEdit,
  canCancel,
  onView,
  onEdit,
  onCancel,
}: {
  request: PickupRequest;
  canEdit: boolean;
  canCancel: boolean;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const WasteIcon = getWasteIcon(
    request.wasteType,
  );

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${
          request.status === "COMPLETED"
            ? "bg-emerald-500"
            : request.status === "CANCELED"
              ? "bg-gray-400"
              : request.status === "REJECTED"
                ? "bg-red-500"
                : request.status ===
                    "IN_PROGRESS"
                  ? "bg-cyan-500"
                  : request.status ===
                      "ASSIGNED"
                    ? "bg-violet-500"
                    : request.status ===
                        "APPROVED"
                      ? "bg-blue-500"
                      : "bg-amber-500"
        }`}
      />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${getWasteAccent(
              request.wasteType,
            )}`}
          >
            <WasteIcon size={22} />
          </div>

          <StatusBadge
            status={request.status}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
            {request.reference}
          </p>

          <h3 className="mt-1 text-lg font-black text-gray-950">
            {request.wasteType}
          </h3>
        </div>

        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-gray-200" />
          <div className="h-2 w-2 rounded-full border border-gray-200 bg-gray-50" />
          <div className="h-px flex-1 border-t border-dashed border-gray-200" />
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-gray-400"
            />

            <p className="line-clamp-2 text-sm leading-5 text-gray-600">
              {request.pickupAddress}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays
              size={17}
              className="shrink-0 text-gray-400"
            />

            <p className="text-sm text-gray-600">
              {formatDate(
                request.preferredDate,
              )}
            </p>
          </div>

          {request.collectorName && (
            <div className="flex items-center gap-3">
              <UserRound
                size={17}
                className="shrink-0 text-gray-400"
              />

              <p className="text-sm text-gray-600">
                {request.collectorName}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-2 text-sm font-bold text-green-800 transition hover:text-green-600"
          >
            Open request

            <ChevronRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </button>

          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${request.reference}`}
                className="rounded-full p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <Pencil size={16} />
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                aria-label={`Cancel ${request.reference}`}
                className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ActivityRail({
  activities,
}: {
  activities: ActivityItem[];
}) {
  return (
    <section className="rounded-[28px] border border-black/5 bg-[#e8efe6] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
            Activity
          </p>

          <h2 className="mt-1 text-xl font-black text-gray-950">
            Recent updates
          </h2>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-800">
          <History size={20} />
        </div>
      </div>

      <div className="mt-7">
        {activities.length === 0 ? (
          <div className="rounded-2xl bg-white/60 p-5 text-center">
            <p className="text-sm font-semibold text-gray-800">
              No recent activity
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Updates about your pickup requests
              will appear here.
            </p>
          </div>
        ) : (
          activities.map(
            (activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                {index !==
                  activities.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-green-900/15" />
                )}

                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      activity.status ===
                      "COMPLETED"
                        ? "bg-emerald-500"
                        : activity.status ===
                            "ASSIGNED"
                          ? "bg-violet-500"
                          : activity.status ===
                              "APPROVED"
                            ? "bg-blue-500"
                            : activity.status ===
                                "CANCELED"
                              ? "bg-gray-500"
                              : activity.status ===
                                  "REJECTED"
                                ? "bg-red-500"
                                : activity.status ===
                                    "IN_PROGRESS"
                                  ? "bg-cyan-500"
                                  : "bg-amber-500"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-950">
                    {activity.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    {
                      activity.description
                    }
                  </p>

                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div className="mt-7 rounded-2xl bg-white/75 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
            <Clock3 size={18} />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900">
              Keep your waste ready
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Place your waste outside shortly
              before the scheduled collection
              window.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({
  status,
  dark = false,
}: {
  status: RequestStatus;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function EmptyRequestView({
  view,
  hasSearch,
  onClearSearch,
  onCreate,
}: {
  view: RequestView;
  hasSearch: boolean;
  onClearSearch: () => void;
  onCreate: () => void;
}) {
  const messages: Record<
    RequestView,
    {
      title: string;
      description: string;
    }
  > = {
    UPCOMING: {
      title: "No upcoming collections",
      description:
        "Your assigned and active collections will appear here.",
    },
    WAITING: {
      title: "Nothing is waiting",
      description:
        "You currently have no requests waiting for review or approval.",
    },
    HISTORY: {
      title: "No collection history",
      description:
        "Completed, cancelled and rejected requests will appear here.",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-800">
        <PackageCheck size={29} />
      </div>

      <h3 className="mt-5 text-xl font-black text-gray-950">
        {hasSearch
          ? "No matching requests"
          : messages[view].title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
        {hasSearch
          ? "Try another request reference, waste type, address or collector name."
          : messages[view].description}
      </p>

      <button
        type="button"
        onClick={
          hasSearch
            ? onClearSearch
            : onCreate
        }
        
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
      >
        {hasSearch ? (
          <>
            <X size={17} />
            Clear search
          </>
        ) : (
          <>
            <Plus size={17} />
            Request a pickup
          </>
        )}
      </button>
    </div>
  );
}

function NoCurrentPickup({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <section className="rounded-[32px] bg-gray-950 px-6 py-12 text-center text-white sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-green-300">
        <Truck size={30} />
      </div>

      <h2 className="mt-5 text-2xl font-black">
        No active collection
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
        Submit a pickup request and track
        every stage of the collection journey
        from this page.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-green-100"
      >
        <Plus size={17} />
        Request a pickup
      </button>
    </section>
  );
}

function CancelRequestModal({
  request,
  reason,
  error,
  isCancelling,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  request: PickupRequest;
  reason: string;
  error: string | null;
  isCancelling: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={22} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            aria-label="Close modal"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="cancel-request-title"
          className="mt-5 text-2xl font-black text-gray-950"
        >
          Cancel this request?
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Request{" "}
          <span className="font-bold text-gray-800">
            {request.reference}
          </span>{" "}
          will be cancelled and moved to your collection history.
        </p>

        <div className="mt-5">
          <label
            htmlFor="cancelReason"
            className="text-sm font-bold text-gray-800"
          >
            Reason for cancellation
            <span className="ml-1 font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <textarea
            id="cancelReason"
            rows={4}
            maxLength={500}
            value={reason}
            disabled={isCancelling}
            onChange={(event) =>
              onReasonChange(event.target.value)
            }
            placeholder="Tell us why you want to cancel this pickup."
            className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-1 flex justify-end">
            <span className="text-xs text-gray-400">
              {reason.length}/500
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p className="text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep request
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Cancelling...
              </>
            ) : (
              <>
                <Trash2 size={17} />
                Cancel request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusMessage(
  request: PickupRequest,
) {
  const messages: Record<
    RequestStatus,
    string
  > = {
    PENDING:
      "Your request has been received and is waiting to be reviewed.",

    APPROVED:
      "Your request has been approved. A collector will be assigned shortly.",

    ASSIGNED: `${
      request.collectorName ?? "A collector"
    } has been assigned to your request.`,

    IN_PROGRESS:
      "Your collector is currently handling this collection.",

    COMPLETED:
      "Your waste collection has been completed successfully.",

    CANCELED:
      "This request was cancelled and no collection will take place.",

    REJECTED:
      "This request could not be approved. View the request for more information.",
  };

  return messages[request.status];
}