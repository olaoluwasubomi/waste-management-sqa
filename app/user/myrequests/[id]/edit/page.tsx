"use client";

import {
  FormEvent,
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
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  Loader2,
  MapPin,
  Package,
  Recycle,
  Save,
} from "lucide-react";

type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

type QuantityUnit =
  | "BAG"
  | "BIN"
  | "ITEM"
  | "KILOGRAM"
  | "TONNE"
  | "OTHER";

interface WasteTypeOption {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  imageUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface AddressOption {
  id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

interface RequestDetails {
  id: string;
  reference: string;
  description: string | null;
  quantity: number;
  quantityUnit: QuantityUnit;
  status: RequestStatus;
  requestedPickupDate: string;

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
}

interface RequestDetailsResponse {
  success: boolean;
  request?: RequestDetails;
  error?: string;
}

interface UpdateRequestResponse {
  success: boolean;
  message?: string;
  error?: string;
  request?: {
    id: string;
    reference: string;
  };
}

interface FormState {
  wasteTypeId: string;
  addressId: string;
  description: string;
  quantity: string;
  quantityUnit: QuantityUnit;
  pickupDate: string;
  pickupTime: string;
}

interface FormErrors {
  wasteTypeId?: string;
  addressId?: string;
  description?: string;
  quantity?: string;
  pickupDate?: string;
  pickupTime?: string;
  submit?: string;
}

const quantityUnits: {
  value: QuantityUnit;
  label: string;
}[] = [
  {
    value: "BAG",
    label: "Bag(s)",
  },
  {
    value: "BIN",
    label: "Bin(s)",
  },
  {
    value: "ITEM",
    label: "Item(s)",
  },
  {
    value: "KILOGRAM",
    label: "Kilogram(s)",
  },
  {
    value: "TONNE",
    label: "Tonne(s)",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const initialFormState: FormState = {
  wasteTypeId: "",
  addressId: "",
  description: "",
  quantity: "1",
  quantityUnit: "BAG",
  pickupDate: "",
  pickupTime: "",
};

function formatAddress(address: AddressOption) {
  return [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatPrice(price: number | string) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(numericPrice);
}

function getDateInputValue(date: string) {
  const parsedDate = new Date(date);

  const year = parsedDate.getFullYear();
  const month = String(
    parsedDate.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeInputValue(date: string) {
  const parsedDate = new Date(date);

  const hours = String(
    parsedDate.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    parsedDate.getMinutes(),
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getTomorrowDate() {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1,
  );

  return tomorrow
    .toISOString()
    .split("T")[0];
}

export default function EditRequestPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const requestId = params.id;

  const [form, setForm] =
    useState<FormState>(
      initialFormState,
    );

  const [wasteTypes, setWasteTypes] =
    useState<WasteTypeOption[]>([]);

  const [addresses, setAddresses] =
    useState<AddressOption[]>([]);

  const [reference, setReference] =
    useState("");

  const [requestStatus, setRequestStatus] =
    useState<RequestStatus | null>(
      null,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isUpdated, setIsUpdated] =
    useState(false);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    const controller =
      new AbortController();

    async function loadEditPage() {
      try {
        setIsLoading(true);
        setErrors({});

        const [
          requestResponse,
          wasteTypeResponse,
          addressResponse,
        ] = await Promise.all([
          fetch(
            `/api/user/requests/${requestId}`,
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          ),

          fetch(
            "/api/admin/get-wastetypes",
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          ),

          fetch(
            "/api/user/addresses",
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          ),
        ]);

        const requestResult =
          (await requestResponse.json()) as RequestDetailsResponse;

        if (
          !requestResponse.ok ||
          !requestResult.success ||
          !requestResult.request
        ) {
          throw new Error(
            requestResult.error ??
              "Unable to load the pickup request",
          );
        }

        if (
          !wasteTypeResponse.ok
        ) {
          throw new Error(
            "Unable to load waste types",
          );
        }

        if (
          !addressResponse.ok
        ) {
          throw new Error(
            "Unable to load addresses",
          );
        }

        const request =
          requestResult.request;

        const wasteTypeResult =
          (await wasteTypeResponse.json()) as WasteTypeOption[];

        const addressResult =
          (await addressResponse.json()) as AddressOption[];

        const activeWasteTypes =
          wasteTypeResult.filter(
            (wasteType) =>
              wasteType.status ===
              "ACTIVE",
          );

     
        const existingWasteType =
          wasteTypeResult.find(
            (wasteType) =>
              wasteType.id ===
              request.wasteType.id,
          );

        const wasteTypesForEdit =
          existingWasteType &&
          !activeWasteTypes.some(
            (wasteType) =>
              wasteType.id ===
              existingWasteType.id,
          )
            ? [
                existingWasteType,
                ...activeWasteTypes,
              ]
            : activeWasteTypes;

        setWasteTypes(
          wasteTypesForEdit,
        );

        setAddresses(addressResult);

        setReference(
          request.reference,
        );

        setRequestStatus(
          request.status,
        );

        setForm({
          wasteTypeId:
            request.wasteType.id,
          addressId:
            request.savedAddress.id,
          description:
            request.description ?? "",
          quantity:
            String(
              request.quantity,
            ),
          quantityUnit:
            request.quantityUnit,
          pickupDate:
            getDateInputValue(
              request.requestedPickupDate,
            ),
          pickupTime:
            getTimeInputValue(
              request.requestedPickupDate,
            ),
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "LOAD EDIT REQUEST ERROR:",
          error,
        );

        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : "Unable to load the request",
        });
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void loadEditPage();

    return () => {
      controller.abort();
    };
  }, [requestId]);

  const selectedWasteType =
    useMemo(
      () =>
        wasteTypes.find(
          (wasteType) =>
            wasteType.id ===
            form.wasteTypeId,
        ) ?? null,
      [
        wasteTypes,
        form.wasteTypeId,
      ],
    );

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address.id ===
            form.addressId,
        ) ?? null,
      [
        addresses,
        form.addressId,
      ],
    );

  function updateField<
    K extends keyof FormState,
  >(
    field: K,
    value: FormState[K],
  ) {
    setForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value,
      }),
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
        submit: undefined,
      }),
    );
  }

  function validateForm() {
    const validationErrors: FormErrors =
      {};

    if (!form.wasteTypeId) {
      validationErrors.wasteTypeId =
        "Select a waste type.";
    }

    if (!form.addressId) {
      validationErrors.addressId =
        "Select a pickup address.";
    }

    const quantity = Number(
      form.quantity,
    );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      validationErrors.quantity =
        "Enter a positive whole number.";
    }

    if (!form.pickupDate) {
      validationErrors.pickupDate =
        "Select a pickup date.";
    }

    if (!form.pickupTime) {
      validationErrors.pickupTime =
        "Select a pickup time.";
    }

    if (
      form.description.length >
      500
    ) {
      validationErrors.description =
        "Description cannot exceed 500 characters.";
    }

    if (
      form.pickupDate &&
      form.pickupTime
    ) {
      const pickupDate =
        new Date(
          `${form.pickupDate}T${form.pickupTime}`,
        );

      if (
        Number.isNaN(
          pickupDate.getTime(),
        ) ||
        pickupDate.getTime() <=
          Date.now()
      ) {
        validationErrors.pickupDate =
          "Pickup date and time must be in the future.";
      }
    }

    setErrors(
      validationErrors,
    );

    return (
      Object.keys(
        validationErrors,
      ).length === 0
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      requestStatus !==
      "PENDING"
    ) {
      setErrors({
        submit:
          "Only pending requests can be edited.",
      });

      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          submit: undefined,
        }),
      );

      const requestedPickupDate =
        new Date(
          `${form.pickupDate}T${form.pickupTime}`,
        ).toISOString();

      const response =
        await fetch(
          `/api/user/requests/${requestId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              wasteTypeId:
                form.wasteTypeId,
              addressId:
                form.addressId,
              description:
                form.description.trim() ||
                null,
              quantity: Number(
                form.quantity,
              ),
              quantityUnit:
                form.quantityUnit,
              requestedPickupDate,
            }),
          },
        );

      const result =
        (await response.json()) as UpdateRequestResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to update the pickup request",
        );
      }

      setIsUpdated(true);

      window.setTimeout(() => {
        router.push(
          `/user/myrequests/${requestId}`,
        );

        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(
        "UPDATE REQUEST ERROR:",
        error,
      );

      setErrors(
        (currentErrors) => ({
          ...currentErrors,

          submit:
            error instanceof Error
              ? error.message
              : "Unable to update the pickup request",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
              Loading request...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    errors.submit &&
    !reference
  ) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10">
        <section className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center">
          <AlertCircle
            size={30}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-5 text-2xl font-black text-gray-950">
            Unable to edit request
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {errors.submit}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/user/myrequests",
              )
            }
            className="mt-6 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Back to requests
          </button>
        </section>
      </main>
    );
  }

  if (
    requestStatus &&
    requestStatus !== "PENDING"
  ) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10">
        <section className="mx-auto max-w-xl rounded-[28px] border border-amber-200 bg-white p-8 text-center">
          <AlertCircle
            size={30}
            className="mx-auto text-amber-600"
          />

          <h1 className="mt-5 text-2xl font-black text-gray-950">
            This request can no
            longer be edited
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Only requests that
            are still pending can
            be modified.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/user/myrequests/${requestId}`,
              )
            }
            className="mt-6 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            View request
          </button>
        </section>
      </main>
    );
  }

  if (isUpdated) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10">
        <section className="mx-auto flex min-h-[550px] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-green-100 bg-white p-10 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2
                size={40}
              />
            </div>

            <h1 className="mt-6 text-3xl font-black text-gray-950">
              Request updated
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
              Your pickup request
              has been updated
              successfully.
            </p>

            <p className="mt-5 text-sm font-bold text-green-800">
              {reference}
            </p>

            <p className="mt-3 text-xs text-gray-400">
              Redirecting to
              request details...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/user/myrequests/${requestId}`,
            )
          }
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-white hover:text-gray-950"
        >
          <ArrowLeft size={18} />
          Back to request
        </button>

        <header className="mt-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
            {reference}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Edit pickup request
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Update your waste
            information, pickup
            location or preferred
            collection date while
            this request is still
            pending.
          </p>
        </header>

        {errors.submit && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-bold">
                Unable to save
                changes
              </p>

              <p className="mt-1 text-sm">
                {errors.submit}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <section className="space-y-6">
            <FormSection
              number="01"
              title="Waste information"
              description="Update the waste type, quantity and additional information."
            >
              <div>
                <FieldLabel
                  htmlFor="wasteType"
                >
                  Waste type
                </FieldLabel>

                <div className="relative mt-2">
                  <Recycle
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    id="wasteType"
                    value={
                      form.wasteTypeId
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "wasteTypeId",
                        event
                          .target
                          .value,
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                  >
                    {wasteTypes.map(
                      (wasteType) => (
                        <option
                          key={
                            wasteType.id
                          }
                          value={
                            wasteType.id
                          }
                        >
                          {
                            wasteType.name
                          }
                          {wasteType.status ===
                          "INACTIVE"
                            ? " (Inactive)"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                <FieldError
                  message={
                    errors.wasteTypeId
                  }
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="quantity"
                  >
                    Quantity
                  </FieldLabel>

                  <div className="relative mt-2">
                    <Package
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        form.quantity
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "quantity",
                          event
                            .target
                            .value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={
                      errors.quantity
                    }
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="quantityUnit"
                  >
                    Unit
                  </FieldLabel>

                  <div className="relative mt-2">
                    <select
                      id="quantityUnit"
                      value={
                        form.quantityUnit
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "quantityUnit",
                          event
                            .target
                            .value as QuantityUnit,
                        )
                      }
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-11 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    >
                      {quantityUnits.map(
                        (unit) => (
                          <option
                            key={
                              unit.value
                            }
                            value={
                              unit.value
                            }
                          >
                            {
                              unit.label
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel
                    htmlFor="description"
                  >
                    Description
                  </FieldLabel>

                  <span className="text-xs text-gray-400">
                    {
                      form
                        .description
                        .length
                    }
                    /500
                  </span>
                </div>

                <textarea
                  id="description"
                  rows={5}
                  maxLength={500}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "description",
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Add any information the collector should know."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                />

                <FieldError
                  message={
                    errors.description
                  }
                />
              </div>
            </FormSection>

            <FormSection
              number="02"
              title="Pickup location"
              description="Choose one of your saved pickup addresses."
            >
              {addresses.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center">
                  <MapPin
                    size={26}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-black text-gray-900">
                    No saved
                    addresses
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Add an address
                    before editing
                    the pickup
                    location.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/user/addresses",
                      )
                    }
                    className="mt-4 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
                  >
                    Manage
                    addresses
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {addresses.map(
                    (address) => {
                      const selected =
                        form.addressId ===
                        address.id;

                      return (
                        <label
                          key={
                            address.id
                          }
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            selected
                              ? "border-green-600 bg-green-50 ring-4 ring-green-600/10"
                              : "border-gray-200 bg-white hover:border-green-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={
                              address.id
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              updateField(
                                "addressId",
                                address.id,
                              )
                            }
                            className="sr-only"
                          />

                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                selected
                                  ? "bg-green-700 text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <Home
                                size={
                                  19
                                }
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-950">
                                {address.label ??
                                  "Pickup address"}
                              </p>

                              <p className="mt-1 text-sm leading-6 text-gray-600">
                                {formatAddress(
                                  address,
                                )}
                              </p>
                            </div>

                            <div
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-green-700 bg-green-700"
                                  : "border-gray-300"
                              }`}
                            >
                              {selected && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    },
                  )}

                  <FieldError
                    message={
                      errors.addressId
                    }
                  />
                </div>
              )}
            </FormSection>

            <FormSection
              number="03"
              title="Pickup date"
              description="Changing this date will be recorded as a reschedule in the request activity."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="pickupDate"
                  >
                    Pickup date
                  </FieldLabel>

                  <div className="relative mt-2">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="pickupDate"
                      type="date"
                      min={
                        getTomorrowDate()
                      }
                      value={
                        form.pickupDate
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "pickupDate",
                          event
                            .target
                            .value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={
                      errors.pickupDate
                    }
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="pickupTime"
                  >
                    Preferred
                    time
                  </FieldLabel>

                  <div className="relative mt-2">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="pickupTime"
                      type="time"
                      value={
                        form.pickupTime
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "pickupTime",
                          event
                            .target
                            .value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={
                      errors.pickupTime
                    }
                  />
                </div>
              </div>
            </FormSection>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[28px] bg-gray-950 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-300">
                  Edit summary
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Review your
                  changes
                </h2>

                <div className="mt-7 space-y-5">
                  <SummaryItem
                    icon={
                      <Recycle
                        size={18}
                      />
                    }
                    label="Waste type"
                    value={
                      selectedWasteType
                        ?.name ??
                      "Not selected"
                    }
                  />

                  <SummaryItem
                    icon={
                      <Package
                        size={18}
                      />
                    }
                    label="Quantity"
                    value={`${form.quantity || "0"} ${
                      quantityUnits.find(
                        (unit) =>
                          unit.value ===
                          form.quantityUnit,
                      )?.label ??
                      form.quantityUnit
                    }`}
                  />

                  <SummaryItem
                    icon={
                      <MapPin
                        size={18}
                      />
                    }
                    label="Pickup address"
                    value={
                      selectedAddress
                        ? formatAddress(
                            selectedAddress,
                          )
                        : "Not selected"
                    }
                  />

                  <SummaryItem
                    icon={
                      <CalendarDays
                        size={18}
                      />
                    }
                    label="Pickup date"
                    value={
                      form.pickupDate ||
                      "Not selected"
                    }
                  />

                  <SummaryItem
                    icon={
                      <Clock3
                        size={18}
                      />
                    }
                    label="Pickup time"
                    value={
                      form.pickupTime ||
                      "Not selected"
                    }
                  />
                </div>

                {selectedWasteType && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        Waste type
                        price
                      </span>

                      <span className="text-lg font-black">
                        {formatPrice(
                          selectedWasteType.price,
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-white/5 p-6">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    addresses.length ===
                      0
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-black text-gray-950 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving
                      changes...
                    </>
                  ) : (
                    <>
                      <Save
                        size={18}
                      />
                      Save changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={
                    isSubmitting
                  }
                  onClick={() =>
                    router.push(
                      `/user/myrequests/${requestId}`,
                    )
                  }
                  className="mt-3 w-full rounded-full px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel editing
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-sm font-black text-green-800">
          {number}
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-950">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-bold text-gray-800"
    >
      {children}

      <span className="ml-1 text-red-500">
        *
      </span>
    </label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
      <AlertCircle
        size={14}
      />
      {message}
    </p>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-green-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold leading-5 text-white">
          {value}
        </p>
      </div>
    </div>
  );
}