"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Recycle,
  Truck,
  UserRound,
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

interface RequestActivity {
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

interface RequestDetails {
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

  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    formatted: string;
  };

  savedAddress: {
    id: string;
    label: string | null;
  };

  wasteType: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    status: string;
  };

  collector: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
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

  activities: RequestActivity[];
}

interface RequestDetailsResponse {
  success: boolean;
  request?: RequestDetails;
  error?: string;
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
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-blue-200 bg-blue-50 text-blue-700",
  ASSIGNED: "border-violet-200 bg-violet-50 text-violet-700",
  IN_PROGRESS: "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELED: "border-gray-200 bg-gray-100 text-gray-600",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const journeySteps = [
  "Requested",
  "Reviewed",
  "Assigned",
  "Collection",
  "Completed",
];

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

function formatDate(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
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

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] =
    useState<RequestDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const requestId = params.id;

  useEffect(() => {
    if (!requestId) {
      return;
    }

    const controller = new AbortController();

    async function fetchRequestDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/user/requests/${requestId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as RequestDetailsResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.request
        ) {
          throw new Error(
            result.error ??
              "Unable to retrieve pickup request",
          );
        }

        setRequest(result.request);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "FETCH REQUEST DETAILS ERROR:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve pickup request",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchRequestDetails();

    return () => {
      controller.abort();
    };
  }, [requestId]);

  const currentStep = useMemo(() => {
    if (!request) {
      return 1;
    }

    return getCurrentStep(request.status);
  }, [request]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f4f7f2]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={38}
              className="mx-auto animate-spin text-green-700"
            />

            <p className="mt-4 text-sm font-semibold text-gray-500">
              Loading request details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10">
        <section className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-gray-950">
            Unable to load request
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error ?? "Pickup request could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/user/myrequests")}
            className="mt-6 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Back to requests
          </button>
        </section>
      </main>
    );
  }

  const isClosed =
    request.status === "CANCELED" ||
    request.status === "REJECTED";

  return (
    <main className="min-h-screen bg-[#f4f7f2]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/user/myrequests")}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-white hover:text-gray-950"
        >
          <ArrowLeft size={18} />
          Back to requests
        </button>

        <header className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
              Pickup request
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              {request.reference}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Submitted {formatDateTime(request.createdAt)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-bold ${statusStyles[request.status]}`}
          >
            {statusLabels[request.status]}
          </span>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[32px] bg-gray-950 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/15 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
              Collection journey
            </p>

            {isClosed ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <XCircle
                    size={22}
                    className={
                      request.status === "REJECTED"
                        ? "text-red-300"
                        : "text-gray-300"
                    }
                  />

                  <div>
                    <h2 className="font-black">
                      {statusLabels[request.status]}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {request.status === "REJECTED"
                        ? request.rejectionReason ??
                          "This request was not approved."
                        : request.cancellationReason ??
                          "This pickup request was cancelled."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-5">
                {journeySteps.map((step, index) => {
                  const stepNumber = index + 1;
                  const completed =
                    stepNumber < currentStep;
                  const current =
                    stepNumber === currentStep;
                  const last =
                    index === journeySteps.length - 1;

                  return (
                    <div
                      key={step}
                      className="relative flex flex-col items-center text-center"
                    >
                      {!last && (
                        <div
                          className={`absolute left-1/2 top-4 h-0.5 w-full ${
                            stepNumber < currentStep
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
                          <Check size={15} strokeWidth={3} />
                        ) : current ? (
                          <Circle
                            size={9}
                            fill="currentColor"
                            strokeWidth={0}
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {stepNumber}
                          </span>
                        )}
                      </div>

                      <span
                        className={`mt-2 hidden text-[11px] font-semibold sm:block ${
                          completed || current
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-7">
            <DetailsPanel
              title="Waste information"
              icon={Recycle}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Waste type"
                  value={request.wasteType.name}
                  icon={Recycle}
                />

                <DetailItem
                  label="Quantity"
                  value={`${request.quantity} ${request.quantityUnit.toLowerCase()}`}
                  icon={Package}
                />

                <DetailItem
                  label="Estimated price"
                  value={formatMoney(
                    request.wasteType.price,
                  )}
                  icon={CreditCard}
                />
              </div>

              {request.description && (
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {request.description}
                  </p>
                </div>
              )}
            </DetailsPanel>

            <DetailsPanel
              title="Pickup information"
              icon={MapPin}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Pickup address"
                  value={request.pickupAddress.formatted}
                  icon={MapPin}
                />

                <DetailItem
                  label="Requested date"
                  value={formatDate(
                    request.requestedPickupDate,
                  )}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Scheduled start"
                  value={formatDateTime(
                    request.scheduledPickupStart,
                  )}
                  icon={Clock3}
                />

                <DetailItem
                  label="Scheduled end"
                  value={formatDateTime(
                    request.scheduledPickupEnd,
                  )}
                  icon={Clock3}
                />
              </div>
            </DetailsPanel>

            <DetailsPanel
              title="Request activity"
              icon={Clock3}
            >
              {request.activities.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-8 text-center">
                  <Clock3
                    size={26}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-bold text-gray-800">
                    No activity available
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Request updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {request.activities.map(
                    (activity, index) => (
                      <div
                        key={activity.id}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {index !==
                          request.activities.length - 1 && (
                          <div className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-gray-200" />
                        )}

                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-700" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-gray-950">
                            {activity.title}
                          </h3>

                          {activity.description && (
                            <p className="mt-1 text-sm leading-6 text-gray-600">
                              {activity.description}
                            </p>
                          )}

                          <p className="mt-2 text-xs font-medium text-gray-400">
                            {formatDateTime(
                              activity.createdAt,
                            )}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </DetailsPanel>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <DetailsPanel
              title="Collector"
              icon={Truck}
            >
              {request.collector ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-800">
                      <UserRound size={22} />
                    </div>

                    <div>
                      <p className="font-black text-gray-950">
                        {request.collector.fullName}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Assigned collector
                      </p>
                    </div>
                  </div>

                  {request.collector.collectorProfile && (
                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                      <SimpleRow
                        label="Zone"
                        value={
                          request.collector
                            .collectorProfile.zone
                        }
                      />

                      <SimpleRow
                        label="Vehicle"
                        value={
                          request.collector
                            .collectorProfile
                            .vehicleRegistration ??
                          "Not provided"
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <Truck
                    size={25}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-bold text-gray-800">
                    No collector assigned
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Collector information will appear
                    here once assigned.
                  </p>
                </div>
              )}
            </DetailsPanel>

            <DetailsPanel
              title="Payment"
              icon={CreditCard}
            >
              {request.payment ? (
                <div className="space-y-3">
                  <SimpleRow
                    label="Amount"
                    value={formatMoney(
                      request.payment.amount,
                    )}
                  />

                  <SimpleRow
                    label="Status"
                    value={request.payment.status}
                  />

                  <SimpleRow
                    label="Transaction reference"
                    value={
                      request.payment.transactionRef ??
                      "Not available"
                    }
                  />

                  {request.payment.paidAt && (
                    <SimpleRow
                      label="Paid"
                      value={formatDateTime(
                        request.payment.paidAt,
                      )}
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <CreditCard
                    size={25}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-bold text-gray-800">
                    No payment record
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Payment information will appear
                    here when available.
                  </p>
                </div>
              )}
            </DetailsPanel>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailsPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-800">
          <Icon size={19} />
        </div>

        <h2 className="text-lg font-black text-gray-950">
          {title}
        </h2>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold leading-6 text-gray-900">
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

      <span className="text-right text-sm font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}