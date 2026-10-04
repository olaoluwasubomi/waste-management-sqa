"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Recycle,
  Trash2,
} from "lucide-react";

type QuantityUnit =
  | "BAG"
  | "BIN"
  | "ITEM"
  | "BOX"
  | "KILOGRAM"
  | "TONNE";

interface WasteTypeOption {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  imageUrl: string | null;
  status:"ACTIVE" | "INACTIVE";
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

type WasteTypesResponse = WasteTypeOption[];

type AddressesResponse = AddressOption[];

interface CreateRequestResponse {
  success: boolean;
  message?: string;
  error?: string;
  request?: {
    id: string;
    reference: string;
    status: string;
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

const initialFormState: FormState = {
  wasteTypeId: "",
  addressId: "",
  description: "",
  quantity: "1",
  quantityUnit: "BAG",
  pickupDate: "",
  pickupTime: "",
};

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
    value: "BOX",
    label: "Box(es)",
  },
  {
    value: "KILOGRAM",
    label: "Kilogram(s)",
  },
  {
    value: "TONNE",
    label: "Tonne(s)",
  },
];

function getTomorrowDate() {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().split("T")[0];
}

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

export default function NewWasteRequestPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(initialFormState);

  const [wasteTypes, setWasteTypes] = useState<
    WasteTypeOption[]
  >([]);

  const [addresses, setAddresses] = useState<
    AddressOption[]
  >([]);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isLoadingOptions, setIsLoadingOptions] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [successReference, setSuccessReference] =
    useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadFormOptions() {
            try {
            setIsLoadingOptions(true);

            const [wasteTypeResponse, addressResponse] =
                await Promise.all([
                fetch("/api/admin/get-wastetypes", {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                }),

                fetch("/api/user/addresses", {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                }),
                ]);

            if (!wasteTypeResponse.ok) {
                throw new Error(
                `Unable to load waste types (${wasteTypeResponse.status})`,
                );
            }

            if (!addressResponse.ok) {
                throw new Error(
                `Unable to load addresses (${addressResponse.status})`,
                );
            }

            const wasteTypeResult =
                (await wasteTypeResponse.json()) as WasteTypesResponse;

            const addressResult =
                (await addressResponse.json()) as AddressesResponse;

            const loadedWasteTypes = wasteTypeResult.filter(
                (wasteType) =>
                wasteType.status === "ACTIVE",
            );

            const loadedAddresses = addressResult;

            setWasteTypes(loadedWasteTypes);
            setAddresses(loadedAddresses);

            const defaultAddress =
                loadedAddresses.find(
                (address) => address.isDefault,
                ) ?? loadedAddresses[0];

            setForm((currentForm) => ({
                ...currentForm,

                wasteTypeId:
                currentForm.wasteTypeId ||
                loadedWasteTypes[0]?.id ||
                "",

                addressId:
                currentForm.addressId ||
                defaultAddress?.id ||
                "",
            }));

            setErrors((currentErrors) => ({
                ...currentErrors,
                submit: undefined,
            }));
            } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === "AbortError"
            ) {
                return;
            }

            console.error(
                "LOAD PICKUP FORM OPTIONS ERROR:",
                error,
            );

            setErrors((currentErrors) => ({
                ...currentErrors,
                submit:
                error instanceof Error
                    ? error.message
                    : "Unable to load the form",
            }));
            } finally {
            if (!controller.signal.aborted) {
                setIsLoadingOptions(false);
            }
            }
        }

        void loadFormOptions();

        return () => {
            controller.abort();
        };
    }, []);

  const selectedWasteType = useMemo(
    () =>
      wasteTypes.find(
        (wasteType) =>
          wasteType.id === form.wasteTypeId,
      ) ?? null,
    [form.wasteTypeId, wasteTypes],
  );

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === form.addressId,
      ) ?? null,
    [addresses, form.addressId],
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      submit: undefined,
    }));
  }

  function validateForm() {
    const validationErrors: FormErrors = {};

    if (!form.wasteTypeId) {
      validationErrors.wasteTypeId =
        "Select a waste type";
    }

    if (!form.addressId) {
      validationErrors.addressId =
        "Select a pickup address";
    }

    const quantity = Number(form.quantity);

    if (
      !form.quantity ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      validationErrors.quantity =
        "Enter a positive whole number";
    }

    if (!form.pickupDate) {
      validationErrors.pickupDate =
        "Select a pickup date";
    }

    if (!form.pickupTime) {
      validationErrors.pickupTime =
        "Select a preferred pickup time";
    }

    if (
      form.description.trim().length > 500
    ) {
      validationErrors.description =
        "Description cannot exceed 500 characters";
    }

    if (
      form.pickupDate &&
      form.pickupTime
    ) {
      const selectedDate = new Date(
        `${form.pickupDate}T${form.pickupTime}`,
      );

      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate.getTime() <= Date.now()
      ) {
        validationErrors.pickupDate =
          "Pickup date and time must be in the future";
      }
    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors).length === 0
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const requestedPickupDate = new Date(
        `${form.pickupDate}T${form.pickupTime}`,
      ).toISOString();

      const response = await fetch(
        "/api/user/newrequests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wasteTypeId: form.wasteTypeId,
            addressId: form.addressId,
            description:
              form.description.trim() || null,
            quantity: Number(form.quantity),
            quantityUnit: form.quantityUnit,
            requestedPickupDate,
          }),
        },
      );

      const result =
        (await response.json()) as CreateRequestResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Unable to create your pickup request",
        );
      }

      setSuccessReference(
        result.request?.reference ?? "Created",
      );

      setTimeout(() => {
        router.push("/user/myrequests");
        router.refresh();
      }, 2000);
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error instanceof Error
            ? error.message
            : "Unable to create your pickup request",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successReference) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] px-4 py-10 sm:px-6">
        <section className="mx-auto flex min-h-[560px] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-green-100 bg-white p-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 size={40} />
            </div>

            <h1 className="mt-6 text-3xl font-black text-gray-950">
              Pickup request submitted
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
              Your waste pickup request has been
              received successfully.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-gray-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                Request reference
              </p>

              <p className="mt-2 text-xl font-black text-green-800">
                {successReference}
              </p>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Redirecting you to your requests...
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
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-gray-950"
        >
          <ArrowLeft size={18} />
          Back to requests
        </button>

        <header className="mt-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
            New collection
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Request a waste pickup
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Tell us what needs to be collected,
            where it should be picked up and your
            preferred collection date.
          </p>
        </header>

        {errors.submit && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-bold">
                Something went wrong
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
              description="Choose the type and quantity of waste you want collected."
            >
              <div>
                <FieldLabel
                  htmlFor="wasteTypeId"
                  required
                >
                  Waste type
                </FieldLabel>

                {isLoadingOptions ? (
                  <LoadingField />
                ) : wasteTypes.length === 0 ? (
                  <EmptyOptionMessage
                    icon={<Recycle size={22} />}
                    title="No waste types available"
                    description="There are currently no active waste types available for collection."
                  />
                ) : (
                  <>
                    <div className="relative mt-2">
                      <Recycle
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <select
                        id="wasteTypeId"
                        value={form.wasteTypeId}
                        onChange={(event) =>
                          updateField(
                            "wasteTypeId",
                            event.target.value,
                          )
                        }
                        className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                      >
                        <option value="">
                          Select a waste type
                        </option>

                        {wasteTypes.map(
                          (wasteType) => (
                            <option
                              key={wasteType.id}
                              value={wasteType.id}
                            >
                              {wasteType.name}
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
                      message={errors.wasteTypeId}
                    />
                  </>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="quantity"
                    required
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
                      value={form.quantity}
                      onChange={(event) =>
                        updateField(
                          "quantity",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={errors.quantity}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="quantityUnit"
                    required
                  >
                    Unit
                  </FieldLabel>

                  <div className="relative mt-2">
                    <select
                      id="quantityUnit"
                      value={form.quantityUnit}
                      onChange={(event) =>
                        updateField(
                          "quantityUnit",
                          event.target
                            .value as QuantityUnit,
                        )
                      }
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-11 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    >
                      {quantityUnits.map((unit) => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
                        </option>
                      ))}
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
                  <FieldLabel htmlFor="description">
                    Description
                  </FieldLabel>

                  <span className="text-xs text-gray-400">
                    {form.description.length}/500
                  </span>
                </div>

                <textarea
                  id="description"
                  rows={5}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe the waste, its condition and anything the collector should know."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                />

                <FieldError
                  message={errors.description}
                />
              </div>
            </FormSection>

            <FormSection
              number="02"
              title="Pickup location"
              description="Select where the waste should be collected."
            >
              {isLoadingOptions ? (
                <LoadingField />
              ) : addresses.length === 0 ? (
                <EmptyOptionMessage
                  icon={<MapPin size={22} />}
                  title="No saved address"
                  description="Add a pickup address before submitting a collection request."
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/user/addresses",
                        )
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
                    >
                      <Plus size={16} />
                      Add address
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-3">
                  {addresses.map((address) => {
                    const selected =
                      form.addressId === address.id;

                    return (
                      <label
                        key={address.id}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          selected
                            ? "border-green-600 bg-green-50 ring-4 ring-green-600/10"
                            : "border-gray-200 bg-white hover:border-green-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          checked={selected}
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
                            <Home size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-gray-950">
                                {address.label ||
                                  "Pickup address"}
                              </p>

                              {address.isDefault && (
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-green-700">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm leading-6 text-gray-600">
                              {formatAddress(address)}
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
                  })}

                  <FieldError
                    message={errors.addressId}
                  />
                </div>
              )}
            </FormSection>

            <FormSection
              number="03"
              title="Preferred collection time"
              description="Choose your preferred date and time. The final collection window may be adjusted after approval."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="pickupDate"
                    required
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
                      min={getTomorrowDate()}
                      value={form.pickupDate}
                      onChange={(event) =>
                        updateField(
                          "pickupDate",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={errors.pickupDate}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="pickupTime"
                    required
                  >
                    Preferred time
                  </FieldLabel>

                  <div className="relative mt-2">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="pickupTime"
                      type="time"
                      value={form.pickupTime}
                      onChange={(event) =>
                        updateField(
                          "pickupTime",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                    />
                  </div>

                  <FieldError
                    message={errors.pickupTime}
                  />
                </div>
              </div>
            </FormSection>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[28px] bg-gray-950 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-300">
                  Request summary
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Review your pickup
                </h2>

                <div className="mt-6 space-y-5">
                  <SummaryItem
                    icon={<Recycle size={18} />}
                    label="Waste type"
                    value={
                      selectedWasteType?.name ||
                      "Not selected"
                    }
                  />

                  <SummaryItem
                    icon={<Package size={18} />}
                    label="Quantity"
                    value={`${form.quantity || "0"} ${
                      quantityUnits.find(
                        (unit) =>
                          unit.value ===
                          form.quantityUnit,
                      )?.label ?? form.quantityUnit
                    }`}
                  />

                  <SummaryItem
                    icon={<MapPin size={18} />}
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
                      <CalendarDays size={18} />
                    }
                    label="Preferred date"
                    value={
                      form.pickupDate
                        ? new Intl.DateTimeFormat(
                            "en-GB",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          ).format(
                            new Date(
                              `${form.pickupDate}T12:00:00`,
                            ),
                          )
                        : "Not selected"
                    }
                  />

                  <SummaryItem
                    icon={<Clock3 size={18} />}
                    label="Preferred time"
                    value={
                      form.pickupTime ||
                      "Not selected"
                    }
                  />
                </div>

                {selectedWasteType && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-400">
                        Estimated charge
                      </span>

                      <span className="text-lg font-black text-white">
                        {formatPrice(
                          selectedWasteType.price,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      The final amount may depend on
                      the quantity and collection
                      requirements.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-white/5 p-6">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingOptions ||
                    wasteTypes.length === 0 ||
                    addresses.length === 0
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-black text-gray-950 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Submitting request...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Submit pickup request
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    router.push("/user/requests")
                  }
                  className="mt-3 w-full rounded-full px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed"
                >
                  Cancel
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
  required = false,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-bold text-gray-800"
    >
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
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
    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle size={14} />
      {message}
    </p>
  );
}

function LoadingField() {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
      <Loader2
        size={18}
        className="animate-spin text-green-700"
      />

      Loading options...
    </div>
  );
}

function EmptyOptionMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-700 shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-sm font-black text-gray-900">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-500">
        {description}
      </p>

      {action}
    </div>
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