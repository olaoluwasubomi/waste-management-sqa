"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Recycle,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

interface Activity {
  id: string;
  type: string;
  status: RequestStatus | null;
  title: string;
  description: string | null;
  createdAt: string;

  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
  } | null;
}

interface AdminRequest {
  id: string;
  reference: string;
  description: string | null;
  quantity: number;
  quantityUnit: string;
  status: RequestStatus;

  requestedPickupDate: string;
  scheduledPickupStart: string | null;
  scheduledPickupEnd: string | null;

  approvedAt: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  rejectedAt: string | null;

  cancellationReason: string | null;
  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;

  resident: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
  };

  wasteType: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    status: string;
  };

  savedAddress: {
    id: string;
    label: string | null;
    street: string;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
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
    email: string;
    phone: string | null;
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
    paidAt: string | null;
    failedAt: string | null;
    refundedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;

  activities: Activity[];
}

interface AdminRequestResponse {
  success: boolean;
  request?: AdminRequest;
  error?: string;
}

interface AvailableCollector {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  image: string | null;
  zone: string;
  vehicleRegistration: string | null;
  isActive: boolean;
  activeAssignments: number;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
}

const journeySteps = [
  "Requested",
  "Approved",
  "Assigned",
  "Collection",
  "Completed",
];

function formatStatus(status: RequestStatus) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getStatusStyle(status: RequestStatus) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "APPROVED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "ASSIGNED":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "IN_PROGRESS":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";

    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CANCELED":
      return "border-gray-200 bg-gray-100 text-gray-600";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function getCurrentStep(status: RequestStatus) {
  switch (status) {
    case "PENDING":
      return 1;

    case "APPROVED":
      return 2;

    case "ASSIGNED":
      return 3;

    case "IN_PROGRESS":
      return 4;

    case "COMPLETED":
      return 5;

    default:
      return 1;
  }
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMoney(amount: number | null) {
  if (amount === null) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default function AdminRequestDetailsPage() {
  const router = useRouter();

  const params = useParams<{
    id: string;
  }>();

  const requestId = params.id;

  const [request, setRequest] =
    useState<AdminRequest | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [rejectModalOpen, setRejectModalOpen] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [assignModalOpen, setAssignModalOpen] =
    useState(false);

  const [isApproving, setIsApproving] = useState(false);

  const [approveError, setApproveError] =
  useState<string | null>(null);

  const [isAssigning, setIsAssigning] =
  useState(false);

  const [assignError, setAssignError] =
  useState<string | null>(null);

useEffect(() => {
    if (!requestId) {
      return;
    }

    const controller =
      new AbortController();

    async function fetchRequestDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const response =
          await fetch(
            `/api/admin/get-requests/${requestId}`,
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as AdminRequestResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.request
        ) {
          throw new Error(
            result.error ??
              "Unable to load pickup request",
          );
        }

        setRequest(
          result.request,
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "FETCH ADMIN REQUEST DETAILS ERROR:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load pickup request",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void fetchRequestDetails();

    return () => {
      controller.abort();
    };
}, [requestId]);


  async function handleApproveRequest() {
  if (!request) {
    return;
  }

  try {
    setIsApproving(true);
    setApproveError(null);

    const response = await fetch(
      `/api/admin/get-requests/${request.id}/approve`,
      {
        method: "PATCH",
      },
    );

    const result = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: string;
      request?: {
        id: string;
        reference: string;
        status: RequestStatus;
        approvedAt: string | null;
        updatedAt: string;
      };
    };

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ??
          "Unable to approve pickup request",
      );
    }

   
    setRequest((currentRequest) => {
      if (!currentRequest) {
        return currentRequest;
      }

      return {
        ...currentRequest,

        status: "APPROVED",

        approvedAt:
          result.request?.approvedAt ??
          new Date().toISOString(),

        updatedAt:
          result.request?.updatedAt ??
          new Date().toISOString(),

        activities: [
          {
            id: `approved-${Date.now()}`,
            type: "REQUEST_APPROVED",
            status: "APPROVED",
            title: "Pickup request approved",
            description:
              "The pickup request was reviewed and approved by an administrator.",
            createdAt: new Date().toISOString(),
            createdBy: null,
          },
          ...currentRequest.activities,
        ],
      };
    });
  } catch (error) {
    console.error(
      "APPROVE REQUEST ERROR:",
      error,
    );

    setApproveError(
      error instanceof Error
        ? error.message
        : "Unable to approve pickup request",
    );
  } finally {
    setIsApproving(false);
  }
}

async function handleAssignCollector(
  collectorId: string,
) {
  if (!request) {
    return;
  }

  try {
    setIsAssigning(true);
    setAssignError(null);

    const response = await fetch(
      `/api/admin/get-requests/${request.id}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectorId,
        }),
      },
    );

    const result = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: string;
      request?: {
        id: string;
        reference: string;
        status: RequestStatus;
        assignedAt: string;
        updatedAt: string;

        collector: {
          id: string;
          firstName: string;
          lastName: string;
          fullName: string;
          email: string;
          phone: string | null;
          image: string | null;

          collectorProfile: {
            zone: string;
            isActive: boolean;
            vehicleRegistration: string | null;
          } | null;
        } | null;
      };
    };

    if (
      !response.ok ||
      !result.success ||
      !result.request
    ) {
      throw new Error(
        result.error ??
          "Unable to assign collector",
      );
    }

    setRequest((currentRequest) => {
      if (!currentRequest) {
        return currentRequest;
      }

      return {
        ...currentRequest,
        status: "ASSIGNED",
        assignedAt:
          result.request?.assignedAt ??
          new Date().toISOString(),
        updatedAt:
          result.request?.updatedAt ??
          new Date().toISOString(),
        collector:
          result.request?.collector ?? null,

        activities: [
          {
            id: `assigned-${Date.now()}`,
            type: "COLLECTOR_ASSIGNED",
            status: "ASSIGNED",
            title: "Collector assigned",
            description:
              result.request?.collector
                ? `${result.request.collector.fullName} was assigned to this pickup request.`
                : "A collector was assigned to this pickup request.",
            createdAt: new Date().toISOString(),
            createdBy: null,
          },
          ...currentRequest.activities,
        ],
      };
    });

    setAssignModalOpen(false);
  } catch (error) {
    console.error(
      "ASSIGN COLLECTOR ERROR:",
      error,
    );

    setAssignError(
      error instanceof Error
        ? error.message
        : "Unable to assign collector",
    );
  } finally {
    setIsAssigning(false);
  }
}

  const currentStep =
    useMemo(() => {
      if (!request) {
        return 1;
      }

      return getCurrentStep(
        request.status,
      );
    }, [request]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={38}
              className="mx-auto animate-spin text-green-700"
            />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading request details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Unable to load request
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error ??
              "The pickup request could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/request-management",
              )
            }
            className="mt-6 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Back to requests
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/request-management",
              )
            }
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-950"
          >
            <ArrowLeft size={18} />
            Back to requests
          </button>

          <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">
                Pickup request
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                {request.reference}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Submitted{" "}
                {formatDateTime(
                  request.createdAt,
                )}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-3.5 py-1.5 text-sm font-semibold ${getStatusStyle(
                request.status,
              )}`}
            >
              {formatStatus(
                request.status,
              )}
            </span>
          </header>

          <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <JourneyPanel
                status={request.status}
                currentStep={currentStep}
                rejectionReason={
                  request.rejectionReason
                }
                cancellationReason={
                  request.cancellationReason
                }
              />

              <Panel
                title="Resident"
                icon={UserRound}
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Resident name"
                    value={
                      request.resident
                        .fullName
                    }
                    icon={UserRound}
                  />

                  <DetailItem
                    label="Email"
                    value={
                      request.resident
                        .email
                    }
                    icon={Mail}
                  />

                  <DetailItem
                    label="Phone"
                    value={
                      request.resident
                        .phone ??
                      "Not provided"
                    }
                    icon={Phone}
                  />
                </div>
              </Panel>

              <Panel
                title="Waste information"
                icon={Recycle}
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Waste type"
                    value={
                      request.wasteType
                        .name
                    }
                    icon={Recycle}
                  />

                  <DetailItem
                    label="Quantity"
                    value={`${request.quantity} ${request.quantityUnit}`}
                    icon={Package}
                  />

                  <DetailItem
                    label="Unit price"
                    value={formatMoney(
                      request.wasteType
                        .price,
                    )}
                    icon={CreditCard}
                  />
                </div>

                {request.wasteType
                  .description && (
                  <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Waste type
                      description
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {
                        request
                          .wasteType
                          .description
                      }
                    </p>
                  </div>
                )}

                {request.description && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Resident notes
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {
                        request.description
                      }
                    </p>
                  </div>
                )}
              </Panel>

              <Panel
                title="Pickup information"
                icon={MapPin}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailItem
                    label="Requested pickup"
                    value={formatDateTime(
                      request.requestedPickupDate,
                    )}
                    icon={CalendarDays}
                  />

                  <DetailItem
                    label="Scheduled window"
                    value={
                      request.scheduledPickupStart
                        ? `${formatDateTime(
                            request.scheduledPickupStart,
                          )} – ${formatDateTime(
                            request.scheduledPickupEnd,
                          )}`
                        : "Not scheduled"
                    }
                    icon={Clock3}
                  />

                  <div className="sm:col-span-2">
                    <DetailItem
                      label="Pickup address"
                      value={
                        request
                          .pickupAddress
                          .formatted
                      }
                      icon={MapPin}
                    />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Activity timeline"
                icon={Clock3}
              >
                {request.activities
                  .length === 0 ? (
                  <EmptyCard
                    icon={Clock3}
                    title="No activity yet"
                    description="Request activity will appear here."
                  />
                ) : (
                  <div>
                    {request.activities.map(
                      (
                        activity,
                        index,
                      ) => (
                        <div
                          key={
                            activity.id
                          }
                          className="relative flex gap-4 pb-7 last:pb-0"
                        >
                          {index !==
                            request
                              .activities
                              .length -
                              1 && (
                            <div className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-gray-200" />
                          )}

                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-700" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {
                                activity.title
                              }
                            </p>

                            {activity.description && (
                              <p className="mt-1 text-sm leading-6 text-gray-500">
                                {
                                  activity.description
                                }
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                              <span>
                                {formatDateTime(
                                  activity.createdAt,
                                )}
                              </span>

                              {activity.createdBy && (
                                <span>
                                  By{" "}
                                  {
                                    activity
                                      .createdBy
                                      .fullName
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Panel>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <RequestActions
                    request={request}
                    isApproving={isApproving}
                    approveError={approveError}
                    onApprove={handleApproveRequest}
                    onReject={() => {
                        setApproveError(null);
                        setRejectModalOpen(true);
                    }}
                    onAssign={() =>
                        setAssignModalOpen(true)
                        
                    }
                />

              <Panel
                title="Collector"
                icon={Truck}
              >
                {request.collector ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                        <Truck
                          size={22}
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {
                            request
                              .collector
                              .fullName
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          Assigned
                          collector
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                      <SimpleRow
                        label="Zone"
                        value={
                          request
                            .collector
                            .collectorProfile
                            ?.zone ??
                          "Not provided"
                        }
                      />

                      <SimpleRow
                        label="Vehicle"
                        value={
                          request
                            .collector
                            .collectorProfile
                            ?.vehicleRegistration ??
                          "Not provided"
                        }
                      />

                      <SimpleRow
                        label="Phone"
                        value={
                          request
                            .collector
                            .phone ??
                          "Not provided"
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyCard
                    icon={Truck}
                    title="No collector assigned"
                    description="A collector can be assigned after the request has been approved."
                  />
                )}
              </Panel>

              <Panel
                title="Payment"
                icon={CreditCard}
              >
                {request.payment ? (
                  <div className="space-y-3">
                    <SimpleRow
                      label="Amount"
                      value={formatMoney(
                        request.payment
                          .amount,
                      )}
                    />

                    <SimpleRow
                      label="Status"
                      value={
                        request.payment
                          .status
                      }
                    />

                    <SimpleRow
                      label="Reference"
                      value={
                        request.payment
                          .transactionRef ??
                        "Not available"
                      }
                    />

                    {request.payment
                      .paidAt && (
                      <SimpleRow
                        label="Paid"
                        value={formatDateTime(
                          request.payment
                            .paidAt,
                        )}
                      />
                    )}
                  </div>
                ) : (
                  <EmptyCard
                    icon={CreditCard}
                    title="No payment record"
                    description="Payment information will appear here when a payment is created."
                  />
                )}
              </Panel>
            </aside>
          </div>
        </div>
      </main>

      {rejectModalOpen && (
        <RejectRequestModal
          reference={
            request.reference
          }
          reason={
            rejectionReason
          }
          onReasonChange={
            setRejectionReason
          }
          onClose={() => {
            setRejectModalOpen(
              false,
            );

            setRejectionReason(
              "",
            );
          }}
          onConfirm={() => {
          
            console.log(
              "Reject request:",
              request.id,
              rejectionReason,
            );
          }}
        />
      )}

      {assignModalOpen && (
        <AssignCollectorModal 
          reference={request.reference}
          isAssigning={isAssigning}
          assignError={assignError}
          onAssign={handleAssignCollector}
          onClose={() => {
            if (isAssigning) {
              return;
            }

            setAssignModalOpen(false);
            setAssignError(null);
          }}
        />
      )}
    </>
  );
}

function RequestActions({
  request,
  isApproving,
  approveError,
  onApprove,
  onReject,
  onAssign,
}: {
  request: AdminRequest;
  isApproving: boolean;
  approveError: string | null;
  onApprove: () => void;
  onReject: () => void;
  onAssign: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
            <ShieldCheck size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Request actions
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              Actions depend on
              the current request
              status.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {request.status === "PENDING" && (
            <>
                <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                    Awaiting review
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                    Review the request information before
                    approving or rejecting it.
                </p>
                </div>

                {approveError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                    <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-600"
                    />

                    <p className="text-sm font-medium text-red-700">
                    {approveError}
                    </p>
                </div>
                )}

                <div className="mt-4 space-y-3">
                <button
                    type="button"
                    onClick={onApprove}
                    disabled={isApproving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isApproving ? (
                    <>
                        <Loader2
                        size={17}
                        className="animate-spin"
                        />
                        Approving...
                    </>
                    ) : (
                    <>
                        <CheckCircle2 size={17} />
                        Approve Request
                    </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onReject}
                    disabled={isApproving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <XCircle size={17} />
                    Reject Request
                </button>
                </div>
            </>
        )}

        {request.status ===
          "APPROVED" && (
          <>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Request
                approved
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                The request is
                ready for a
                collector to be
                assigned.
              </p>
            </div>

            <button
              type="button"
              onClick={onAssign}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              <Truck size={17} />
              Assign Collector
            </button>
          </>
        )}

        {request.status ===
          "ASSIGNED" && (
          <StatusInformation
            title="Collector assigned"
            description="This request has been assigned and is waiting for collection to begin."
          />
        )}

        {request.status ===
          "IN_PROGRESS" && (
          <StatusInformation
            title="Collection in progress"
            description="The assigned collector is currently handling this pickup."
          />
        )}

        {request.status ===
          "COMPLETED" && (
          <StatusInformation
            title="Collection completed"
            description="No further administrative action is required."
          />
        )}

        {request.status ===
          "CANCELED" && (
          <StatusInformation
            title="Request cancelled"
            description="The resident cancelled this pickup request."
          />
        )}

        {request.status ===
          "REJECTED" && (
          <StatusInformation
            title="Request rejected"
            description="This request has been rejected and is now closed."
          />
        )}
      </div>
    </section>
  );
}

function JourneyPanel({
  status,
  currentStep,
  rejectionReason,
  cancellationReason,
}: {
  status: RequestStatus;
  currentStep: number;
  rejectionReason: string | null;
  cancellationReason: string | null;
}) {
  const closed =
    status === "REJECTED" ||
    status === "CANCELED";

  return (
    <section className="overflow-hidden rounded-2xl bg-gray-950 p-6 text-white shadow-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-300">
        Collection journey
      </p>

      {closed ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-red-300" />

            <div>
              <p className="font-semibold">
                {formatStatus(
                  status,
                )}
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-300">
                {status ===
                "REJECTED"
                  ? rejectionReason ??
                    "The request was rejected."
                  : cancellationReason ??
                    "The request was cancelled."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-5">
          {journeySteps.map(
            (step, index) => {
              const stepNumber =
                index + 1;

              const completed =
                stepNumber <
                currentStep;

              const current =
                stepNumber ===
                currentStep;

              return (
                <div
                  key={step}
                  className="relative flex flex-col items-center text-center"
                >
                  {index !==
                    journeySteps.length -
                      1 && (
                    <div
                      className={`absolute left-1/2 top-4 h-0.5 w-full ${
                        stepNumber <
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
                        strokeWidth={
                          3
                        }
                      />
                    ) : current ? (
                      <Circle
                        size={9}
                        fill="currentColor"
                        strokeWidth={
                          0
                        }
                      />
                    ) : (
                      <span className="text-xs font-semibold">
                        {
                          stepNumber
                        }
                      </span>
                    )}
                  </div>

                  <span
                    className={`mt-2 hidden text-[11px] font-medium sm:block ${
                      completed ||
                      current
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <Icon size={18} />
        </div>

        <h2 className="font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function SimpleRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

function EmptyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-5 text-center">
      <Icon
        size={24}
        className="mx-auto text-gray-400"
      />

      <p className="mt-3 text-sm font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function StatusInformation({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function RejectRequestModal({
  reference,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  reference: string;
  reason: string;
  onReasonChange: (
    value: string,
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <XCircle size={21} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={19} />
          </button>
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-950">
          Reject request?
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Provide a reason for
          rejecting{" "}
          <span className="font-semibold text-gray-800">
            {reference}
          </span>
          . The resident should
          be able to see this
          reason.
        </p>

        <div className="mt-5">
          <label
            htmlFor="rejectionReason"
            className="text-sm font-semibold text-gray-800"
          >
            Rejection reason
          </label>

          <textarea
            id="rejectionReason"
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(event) =>
              onReasonChange(
                event.target.value,
              )
            }
            placeholder="Explain why this request cannot be approved."
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {reason.length}/500
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !reason.trim()
            }
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignCollectorModal({
  reference,
  isAssigning,
  assignError,
  onAssign,
  onClose,
}: {
  reference: string;
  isAssigning: boolean;
  assignError: string | null;
  onAssign: (collectorId: string) => void;
  onClose: () => void;
}) {
  const [collectors, setCollectors] =
    useState<AvailableCollector[]>([]);

  const [
    selectedCollectorId,
    setSelectedCollectorId,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    isLoadingCollectors,
    setIsLoadingCollectors,
  ] = useState(true);

  const [
    collectorError,
    setCollectorError,
  ] = useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadCollectors() {
      try {
        setIsLoadingCollectors(true);
        setCollectorError(null);

        const response = await fetch(
          "/api/admin/get-collectors?availableOnly=true",
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as
            | AvailableCollector[]
            | {
                error?: string;
              };

        if (!response.ok) {
          const errorResult =
            result as {
              error?: string;
            };

          throw new Error(
            errorResult.error ??
              "Unable to load collectors",
          );
        }

        if (!Array.isArray(result)) {
          throw new Error(
            "Invalid collector response",
          );
        }

        setCollectors(result);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "LOAD COLLECTORS ERROR:",
          error,
        );

        setCollectorError(
          error instanceof Error
            ? error.message
            : "Unable to load collectors",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCollectors(false);
        }
      }
    }

    void loadCollectors();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredCollectors =
    collectors.filter((collector) => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return true;
      }

      return (
        collector.name
          .toLowerCase()
          .includes(value) ||
        collector.email
          .toLowerCase()
          .includes(value) ||
        collector.zone
          .toLowerCase()
          .includes(value) ||
        collector.vehicleRegistration
          ?.toLowerCase()
          .includes(value)
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Assign collector
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select an active collector for{" "}
              <span className="font-semibold">
                {reference}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-gray-100 p-5">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search collector, email, zone or vehicle..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoadingCollectors ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-green-700"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Loading collectors...
                </p>
              </div>
            </div>
          ) : collectorError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                {collectorError}
              </p>
            </div>
          ) : filteredCollectors.length === 0 ? (
            <div className="py-14 text-center">
              <Truck
                size={28}
                className="mx-auto text-gray-400"
              />

              <p className="mt-3 font-semibold text-gray-900">
                No available collectors
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No active collectors match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCollectors.map(
                (collector) => {
                  const selected =
                    selectedCollectorId ===
                    collector.id;

                  return (
                    <button
                      key={collector.id}
                      type="button"
                      disabled={isAssigning}
                      onClick={() =>
                        setSelectedCollectorId(
                          collector.id,
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <UserRound size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-950">
                            {collector.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {collector.email}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                            <div>
                              <p className="text-gray-400">
                                Zone
                              </p>

                              <p className="mt-0.5 font-medium text-gray-700">
                                {collector.zone}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400">
                                Vehicle
                              </p>

                              <p className="mt-0.5 font-medium text-gray-700">
                                {collector.vehicleRegistration ??
                                  "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400">
                                Active pickups
                              </p>

                              <p className="mt-0.5 font-medium text-gray-700">
                                {
                                  collector.activeAssignments
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}

          {assignError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">
                {assignError}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !selectedCollectorId ||
              isAssigning
            }
            onClick={() =>
              onAssign(
                selectedCollectorId,
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAssigning ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Assigning...
              </>
            ) : (
              <>
                <Truck size={17} />
                Assign Collector
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}