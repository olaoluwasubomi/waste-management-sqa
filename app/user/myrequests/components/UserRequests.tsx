// // "use client";

// // import { useMemo, useState } from "react";
// // import { useRouter } from "next/navigation";
// // import {
// //   CalendarDays,
// //   CheckCircle2,
// //   ChevronRight,
// //   Clock3,
// //   MapPin,
// //   PackageSearch,
// //   Pencil,
// //   Plus,
// //   Search,
// //   Trash2,
// //   X,
// // } from "lucide-react";

// // type RequestStatus =
// //   | "PENDING"
// //   | "APPROVED"
// //   | "ASSIGNED"
// //   | "IN_PROGRESS"
// //   | "COMPLETED"
// //   | "CANCELLED"
// //   | "REJECTED";

// // interface PickupRequest {
// //   id: string;
// //   reference: string;
// //   wasteType: string;
// //   pickupAddress: string;
// //   preferredDate: string;
// //   createdAt: string;
// //   status: RequestStatus;
// //   collectorName?: string | null;
// // }

// // const initialRequests: PickupRequest[] = [
// //   {
// //     id: "req-001",
// //     reference: "WR-1024",
// //     wasteType: "Household Waste",
// //     pickupAddress: "25 Paradise Street, Coventry, CV1 2JU",
// //     preferredDate: "2026-07-24T09:00:00.000Z",
// //     createdAt: "2026-07-18T10:00:00.000Z",
// //     status: "PENDING",
// //     collectorName: null,
// //   },
// //   {
// //     id: "req-002",
// //     reference: "WR-1023",
// //     wasteType: "Plastic Waste",
// //     pickupAddress: "14 Far Gosford Street, Coventry, CV1 5DW",
// //     preferredDate: "2026-07-22T11:00:00.000Z",
// //     createdAt: "2026-07-16T14:30:00.000Z",
// //     status: "APPROVED",
// //     collectorName: null,
// //   },
// //   {
// //     id: "req-003",
// //     reference: "WR-1022",
// //     wasteType: "Garden Waste",
// //     pickupAddress: "81 Walsgrave Road, Coventry, CV2 4ED",
// //     preferredDate: "2026-07-20T10:00:00.000Z",
// //     createdAt: "2026-07-14T09:15:00.000Z",
// //     status: "ASSIGNED",
// //     collectorName: "Daniel Williams",
// //   },
// //   {
// //     id: "req-004",
// //     reference: "WR-1021",
// //     wasteType: "Mixed Recyclables",
// //     pickupAddress: "10 Albany Road, Coventry, CV5 6JU",
// //     preferredDate: "2026-07-18T08:30:00.000Z",
// //     createdAt: "2026-07-12T13:20:00.000Z",
// //     status: "IN_PROGRESS",
// //     collectorName: "Sarah Thompson",
// //   },
// //   {
// //     id: "req-005",
// //     reference: "WR-1020",
// //     wasteType: "Electronic Waste",
// //     pickupAddress: "42 Foleshill Road, Coventry, CV1 4NU",
// //     preferredDate: "2026-07-14T12:00:00.000Z",
// //     createdAt: "2026-07-10T16:45:00.000Z",
// //     status: "COMPLETED",
// //     collectorName: "Michael Brown",
// //   },
// //   {
// //     id: "req-006",
// //     reference: "WR-1019",
// //     wasteType: "Household Waste",
// //     pickupAddress: "7 Queen Victoria Road, Coventry, CV1 3JH",
// //     preferredDate: "2026-07-11T09:00:00.000Z",
// //     createdAt: "2026-07-08T11:10:00.000Z",
// //     status: "CANCELLED",
// //     collectorName: null,
// //   },
// // ];

// // const statusFilters: {
// //   label: string;
// //   value: "ALL" | RequestStatus;
// // }[] = [
// //   { label: "All", value: "ALL" },
// //   { label: "Pending", value: "PENDING" },
// //   { label: "Approved", value: "APPROVED" },
// //   { label: "Assigned", value: "ASSIGNED" },
// //   { label: "In Progress", value: "IN_PROGRESS" },
// //   { label: "Completed", value: "COMPLETED" },
// //   { label: "Cancelled", value: "CANCELLED" },
// // ];

// // const statusStyles: Record<RequestStatus, string> = {
// //   PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
// //   APPROVED: "bg-blue-50 text-blue-700 ring-blue-600/20",
// //   ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-600/20",
// //   IN_PROGRESS: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
// //   COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",
// //   CANCELLED: "bg-gray-100 text-gray-600 ring-gray-500/20",
// //   REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
// // };

// // const statusLabels: Record<RequestStatus, string> = {
// //   PENDING: "Pending",
// //   APPROVED: "Approved",
// //   ASSIGNED: "Assigned",
// //   IN_PROGRESS: "In Progress",
// //   COMPLETED: "Completed",
// //   CANCELLED: "Cancelled",
// //   REJECTED: "Rejected",
// // };

// // function formatDate(date: string) {
// //   return new Intl.DateTimeFormat("en-GB", {
// //     day: "2-digit",
// //     month: "short",
// //     year: "numeric",
// //   }).format(new Date(date));
// // }

// // function StatusBadge({ status }: { status: RequestStatus }) {
// //   return (
// //     <span
// //       className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
// //     >
// //       {statusLabels[status]}
// //     </span>
// //   );
// // }

// // export default function MyRequests() {
// //   const router = useRouter();

// //   const [requests, setRequests] =
// //     useState<PickupRequest[]>(initialRequests);

// //   const [selectedStatus, setSelectedStatus] = useState<
// //     "ALL" | RequestStatus
// //   >("ALL");

// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [cancelTarget, setCancelTarget] =
// //     useState<PickupRequest | null>(null);

// //   const filteredRequests = useMemo(() => {
// //     const normalizedSearch = searchTerm.trim().toLowerCase();

// //     return requests.filter((request) => {
// //       const matchesStatus =
// //         selectedStatus === "ALL" ||
// //         request.status === selectedStatus;

// //       const matchesSearch =
// //         !normalizedSearch ||
// //         request.reference.toLowerCase().includes(normalizedSearch) ||
// //         request.wasteType.toLowerCase().includes(normalizedSearch) ||
// //         request.pickupAddress.toLowerCase().includes(normalizedSearch) ||
// //         request.collectorName
// //           ?.toLowerCase()
// //           .includes(normalizedSearch);

// //       return matchesStatus && matchesSearch;
// //     });
// //   }, [requests, searchTerm, selectedStatus]);

// //   const summary = useMemo(() => {
// //     return {
// //       total: requests.length,
// //       active: requests.filter((request) =>
// //         [
// //           "PENDING",
// //           "APPROVED",
// //           "ASSIGNED",
// //           "IN_PROGRESS",
// //         ].includes(request.status),
// //       ).length,
// //       completed: requests.filter(
// //         (request) => request.status === "COMPLETED",
// //       ).length,
// //     };
// //   }, [requests]);

// //   const canEdit = (status: RequestStatus) =>
// //     status === "PENDING";

// //   const canCancel = (status: RequestStatus) =>
// //     status === "PENDING" || status === "APPROVED";

// //   const handleCancelRequest = () => {
// //     if (!cancelTarget) return;

// //     setRequests((currentRequests) =>
// //       currentRequests.map((request) =>
// //         request.id === cancelTarget.id
// //           ? {
// //               ...request,
// //               status: "CANCELLED",
// //             }
// //           : request,
// //       ),
// //     );

// //     setCancelTarget(null);
// //   };

// //   return (
// //     <>
// //       <div className="space-y-6">
// //         <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
// //           <div>
// //             <p className="text-sm font-semibold text-green-700">
// //               Waste collection
// //             </p>

// //             <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
// //               My Requests
// //             </h1>

// //             <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
// //               View, manage and track all your waste pickup requests.
// //             </p>
// //           </div>

// //           <button
// //             type="button"
// //             onClick={() => router.push("/user/requests/new")}
// //             className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
// //           >
// //             <Plus size={18} />
// //             Request Pickup
// //           </button>
// //         </section>

// //         <section className="grid gap-4 sm:grid-cols-3">
// //           <SummaryCard
// //             label="Total Requests"
// //             value={summary.total}
// //             icon={<PackageSearch size={21} />}
// //           />

// //           <SummaryCard
// //             label="Active Requests"
// //             value={summary.active}
// //             icon={<Clock3 size={21} />}
// //           />

// //           <SummaryCard
// //             label="Completed"
// //             value={summary.completed}
// //             icon={<CheckCircle2 size={21} />}
// //           />
// //         </section>

// //         <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
// //           <div className="border-b border-gray-200 p-4 sm:p-5">
// //             <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
// //               <div className="relative w-full xl:max-w-md">
// //                 <Search
// //                   size={19}
// //                   className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
// //                 />

// //                 <input
// //                   type="search"
// //                   value={searchTerm}
// //                   onChange={(event) =>
// //                     setSearchTerm(event.target.value)
// //                   }
// //                   placeholder="Search by reference, waste type or address"
// //                   className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-600/15"
// //                 />

// //                 {searchTerm && (
// //                   <button
// //                     type="button"
// //                     onClick={() => setSearchTerm("")}
// //                     aria-label="Clear search"
// //                     className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
// //                   >
// //                     <X size={16} />
// //                   </button>
// //                 )}
// //               </div>

// //               <div className="flex gap-2 overflow-x-auto pb-1">
// //                 {statusFilters.map((filter) => {
// //                   const isSelected =
// //                     selectedStatus === filter.value;

// //                   return (
// //                     <button
// //                       key={filter.value}
// //                       type="button"
// //                       onClick={() =>
// //                         setSelectedStatus(filter.value)
// //                       }
// //                       className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
// //                         isSelected
// //                           ? "bg-green-700 text-white"
// //                           : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
// //                       }`}
// //                     >
// //                       {filter.label}
// //                     </button>
// //                   );
// //                 })}
// //               </div>
// //             </div>
// //           </div>

// //           {filteredRequests.length === 0 ? (
// //             <EmptyRequests
// //               hasRequests={requests.length > 0}
// //               onCreateRequest={() =>
// //                 router.push("/user/requests/new")
// //               }
// //               onClearFilters={() => {
// //                 setSearchTerm("");
// //                 setSelectedStatus("ALL");
// //               }}
// //             />
// //           ) : (
// //             <>
// //               <div className="hidden overflow-x-auto md:block">
// //                 <table className="w-full">
// //                   <thead className="bg-gray-50">
// //                     <tr className="border-b border-gray-200">
// //                       <TableHeading>Reference</TableHeading>
// //                       <TableHeading>Waste Type</TableHeading>
// //                       <TableHeading>Pickup Address</TableHeading>
// //                       <TableHeading>Pickup Date</TableHeading>
// //                       <TableHeading>Status</TableHeading>
// //                       <TableHeading align="right">
// //                         Actions
// //                       </TableHeading>
// //                     </tr>
// //                   </thead>

// //                   <tbody className="divide-y divide-gray-100">
// //                     {filteredRequests.map((request) => (
// //                       <tr
// //                         key={request.id}
// //                         className="transition hover:bg-gray-50/80"
// //                       >
// //                         <td className="whitespace-nowrap px-5 py-4">
// //                           <p className="text-sm font-semibold text-gray-900">
// //                             {request.reference}
// //                           </p>

// //                           <p className="mt-1 text-xs text-gray-500">
// //                             Submitted {formatDate(request.createdAt)}
// //                           </p>
// //                         </td>

// //                         <td className="px-5 py-4 text-sm font-medium text-gray-700">
// //                           {request.wasteType}
// //                         </td>

// //                         <td className="max-w-xs px-5 py-4">
// //                           <div className="flex items-start gap-2">
// //                             <MapPin
// //                               size={16}
// //                               className="mt-0.5 shrink-0 text-gray-400"
// //                             />

// //                             <span className="line-clamp-2 text-sm text-gray-600">
// //                               {request.pickupAddress}
// //                             </span>
// //                           </div>
// //                         </td>

// //                         <td className="whitespace-nowrap px-5 py-4">
// //                           <div className="flex items-center gap-2 text-sm text-gray-600">
// //                             <CalendarDays
// //                               size={16}
// //                               className="text-gray-400"
// //                             />

// //                             {formatDate(request.preferredDate)}
// //                           </div>
// //                         </td>

// //                         <td className="whitespace-nowrap px-5 py-4">
// //                           <StatusBadge status={request.status} />
// //                         </td>

// //                         <td className="whitespace-nowrap px-5 py-4 text-right">
// //                           <RequestActions
// //                             request={request}
// //                             canEdit={canEdit(request.status)}
// //                             canCancel={canCancel(request.status)}
// //                             onView={() =>
// //                               router.push(
// //                                 `/user/requests/${request.id}`,
// //                               )
// //                             }
// //                             onEdit={() =>
// //                               router.push(
// //                                 `/user/requests/${request.id}/edit`,
// //                               )
// //                             }
// //                             onCancel={() =>
// //                               setCancelTarget(request)
// //                             }
// //                           />
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>

// //               <div className="divide-y divide-gray-100 md:hidden">
// //                 {filteredRequests.map((request) => (
// //                   <RequestCard
// //                     key={request.id}
// //                     request={request}
// //                     canEdit={canEdit(request.status)}
// //                     canCancel={canCancel(request.status)}
// //                     onView={() =>
// //                       router.push(`/user/requests/${request.id}`)
// //                     }
// //                     onEdit={() =>
// //                       router.push(
// //                         `/user/requests/${request.id}/edit`,
// //                       )
// //                     }
// //                     onCancel={() => setCancelTarget(request)}
// //                   />
// //                 ))}
// //               </div>

// //               <div className="border-t border-gray-200 px-5 py-4">
// //                 <p className="text-sm text-gray-500">
// //                   Showing{" "}
// //                   <span className="font-semibold text-gray-700">
// //                     {filteredRequests.length}
// //                   </span>{" "}
// //                   of{" "}
// //                   <span className="font-semibold text-gray-700">
// //                     {requests.length}
// //                   </span>{" "}
// //                   requests
// //                 </p>
// //               </div>
// //             </>
// //           )}
// //         </section>
// //       </div>

// //       {cancelTarget && (
// //         <CancelRequestModal
// //           request={cancelTarget}
// //           onClose={() => setCancelTarget(null)}
// //           onConfirm={handleCancelRequest}
// //         />
// //       )}
// //     </>
// //   );
// // }

// // function SummaryCard({
// //   label,
// //   value,
// //   icon,
// // }: {
// //   label: string;
// //   value: number;
// //   icon: React.ReactNode;
// // }) {
// //   return (
// //     <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <p className="text-sm font-medium text-gray-500">
// //             {label}
// //           </p>

// //           <p className="mt-2 text-3xl font-bold text-gray-900">
// //             {value}
// //           </p>
// //         </div>

// //         <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
// //           {icon}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // function TableHeading({
// //   children,
// //   align = "left",
// // }: {
// //   children: React.ReactNode;
// //   align?: "left" | "right";
// // }) {
// //   return (
// //     <th
// //       className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
// //         align === "right" ? "text-right" : "text-left"
// //       }`}
// //     >
// //       {children}
// //     </th>
// //   );
// // }

// // function RequestActions({
// //   request,
// //   canEdit,
// //   canCancel,
// //   onView,
// //   onEdit,
// //   onCancel,
// // }: {
// //   request: PickupRequest;
// //   canEdit: boolean;
// //   canCancel: boolean;
// //   onView: () => void;
// //   onEdit: () => void;
// //   onCancel: () => void;
// // }) {
// //   return (
// //     <div className="inline-flex items-center justify-end gap-1">
// //       <button
// //         type="button"
// //         onClick={onView}
// //         title={`View ${request.reference}`}
// //         className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-green-700"
// //       >
// //         <PackageSearch size={18} />
// //       </button>

// //       {canEdit && (
// //         <button
// //           type="button"
// //           onClick={onEdit}
// //           title={`Edit ${request.reference}`}
// //           className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
// //         >
// //           <Pencil size={18} />
// //         </button>
// //       )}

// //       {canCancel && (
// //         <button
// //           type="button"
// //           onClick={onCancel}
// //           title={`Cancel ${request.reference}`}
// //           className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-700"
// //         >
// //           <Trash2 size={18} />
// //         </button>
// //       )}

// //       <button
// //         type="button"
// //         onClick={onView}
// //         title="Open request"
// //         className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
// //       >
// //         <ChevronRight size={18} />
// //       </button>
// //     </div>
// //   );
// // }

// // function RequestCard({
// //   request,
// //   canEdit,
// //   canCancel,
// //   onView,
// //   onEdit,
// //   onCancel,
// // }: {
// //   request: PickupRequest;
// //   canEdit: boolean;
// //   canCancel: boolean;
// //   onView: () => void;
// //   onEdit: () => void;
// //   onCancel: () => void;
// // }) {
// //   return (
// //     <article className="p-4 sm:p-5">
// //       <div className="flex items-start justify-between gap-3">
// //         <div>
// //           <p className="text-sm font-bold text-gray-900">
// //             {request.reference}
// //           </p>

// //           <p className="mt-1 text-xs text-gray-500">
// //             Submitted {formatDate(request.createdAt)}
// //           </p>
// //         </div>

// //         <StatusBadge status={request.status} />
// //       </div>

// //       <div className="mt-4">
// //         <p className="font-semibold text-gray-800">
// //           {request.wasteType}
// //         </p>

// //         <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
// //           <MapPin
// //             size={17}
// //             className="mt-0.5 shrink-0 text-gray-400"
// //           />

// //           <span>{request.pickupAddress}</span>
// //         </div>

// //         <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
// //           <CalendarDays
// //             size={17}
// //             className="shrink-0 text-gray-400"
// //           />

// //           <span>
// //             Pickup: {formatDate(request.preferredDate)}
// //           </span>
// //         </div>

// //         {request.collectorName && (
// //           <p className="mt-2 text-sm text-gray-600">
// //             Collector:{" "}
// //             <span className="font-medium text-gray-800">
// //               {request.collectorName}
// //             </span>
// //           </p>
// //         )}
// //       </div>

// //       <div className="mt-5 flex flex-wrap gap-2">
// //         <button
// //           type="button"
// //           onClick={onView}
// //           className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
// //         >
// //           View Request
// //           <ChevronRight size={16} />
// //         </button>

// //         {canEdit && (
// //           <button
// //             type="button"
// //             onClick={onEdit}
// //             className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
// //           >
// //             <Pencil size={16} />
// //             Edit
// //           </button>
// //         )}

// //         {canCancel && (
// //           <button
// //             type="button"
// //             onClick={onCancel}
// //             aria-label={`Cancel ${request.reference}`}
// //             className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2.5 text-red-600 transition hover:bg-red-50"
// //           >
// //             <Trash2 size={17} />
// //           </button>
// //         )}
// //       </div>
// //     </article>
// //   );
// // }

// // function EmptyRequests({
// //   hasRequests,
// //   onCreateRequest,
// //   onClearFilters,
// // }: {
// //   hasRequests: boolean;
// //   onCreateRequest: () => void;
// //   onClearFilters: () => void;
// // }) {
// //   return (
// //     <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
// //       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
// //         <PackageSearch size={27} />
// //       </div>

// //       <h2 className="mt-4 text-lg font-bold text-gray-900">
// //         {hasRequests
// //           ? "No matching requests"
// //           : "No pickup requests yet"}
// //       </h2>

// //       <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
// //         {hasRequests
// //           ? "No requests match your current search or status filter."
// //           : "When you submit a waste pickup request, you will be able to track it here."}
// //       </p>

// //       <button
// //         type="button"
// //         onClick={
// //           hasRequests ? onClearFilters : onCreateRequest
// //         }
// //         className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
// //       >
// //         {hasRequests ? (
// //           "Clear Filters"
// //         ) : (
// //           <>
// //             <Plus size={17} />
// //             Request Pickup
// //           </>
// //         )}
// //       </button>
// //     </div>
// //   );
// // }

// // function CancelRequestModal({
// //   request,
// //   onClose,
// //   onConfirm,
// // }: {
// //   request: PickupRequest;
// //   onClose: () => void;
// //   onConfirm: () => void;
// // }) {
// //   return (
// //     <div
// //       role="dialog"
// //       aria-modal="true"
// //       aria-labelledby="cancel-request-title"
// //       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
// //     >
// //       <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
// //         <div className="flex items-start justify-between gap-4">
// //           <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
// //             <Trash2 size={21} />
// //           </div>

// //           <button
// //             type="button"
// //             onClick={onClose}
// //             aria-label="Close cancellation modal"
// //             className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
// //           >
// //             <X size={20} />
// //           </button>
// //         </div>

// //         <h2
// //           id="cancel-request-title"
// //           className="mt-5 text-xl font-bold text-gray-900"
// //         >
// //           Cancel pickup request?
// //         </h2>

// //         <p className="mt-2 text-sm leading-6 text-gray-500">
// //           You are about to cancel request{" "}
// //           <span className="font-semibold text-gray-700">
// //             {request.reference}
// //           </span>
// //           . It will remain visible in your request history.
// //         </p>

// //         <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
// //           <button
// //             type="button"
// //             onClick={onClose}
// //             className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
// //           >
// //             Keep Request
// //           </button>

// //           <button
// //             type="button"
// //             onClick={onConfirm}
// //             className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
// //           >
// //             Cancel Request
// //           </button>
// //         </div> 
// //       </div>
// //     </div>
// //   );
// // }


// "use client";

// import { useMemo, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowRight,
//   CalendarDays,
//   Check,
//   ChevronRight,
//   Circle,
//   Clock3,
//   History,
//   Home,
//   Laptop,
//   Leaf,
//   MapPin,
//   PackageCheck,
//   Pencil,
//   Plus,
//   Recycle,
//   Search,
//   Trash2,
//   Truck,
//   UserRound,
//   X,
// } from "lucide-react";

// type RequestStatus =
//   | "PENDING"
//   | "APPROVED"
//   | "ASSIGNED"
//   | "IN_PROGRESS"
//   | "COMPLETED"
//   | "CANCELED"
//   | "REJECTED";

// type RequestView = "UPCOMING" | "WAITING" | "HISTORY";

// interface PickupRequest {
//   id: string;
//   reference: string;
//   wasteType: string;
//   pickupAddress: string;
//   preferredDate: string;
//   createdAt: string;
//   status: RequestStatus;
//   collectorName?: string | null;
//   collectionWindow?: string | null;
//   notes?: string | null;
// }

// interface ApiWasteRequest {
//   id: string;
//   reference: string;
//   description: string | null;
//   quantity: number;
//   quantityUnit: string;
//   status: RequestStatus;
//   requestedPickupDate: string;
//   scheduledPickupStart: string | null;
//   scheduledPickupEnd: string | null;
//   createdAt: string;
//   updatedAt: string;

//   pickupAddress: {
//     street: string;
//     city: string;
//     state: string;
//     postalCode: string | null;
//     country: string;
//     formatted: string;
//   };

//   wasteType: {
//     id: string;
//     name: string;
//     description: string | null;
//     price: number | string;
//     imageUrl: string | null;
//   };

//   collector: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     fullName: string;
//     phone: string | null;
//     image: string | null;
//     collectorProfile: {
//       zone: string | null;
//       vehicleRegistration: string | null;
//     } | null;
//   } | null;

//   activities: ApiActivity[];
// }

// interface ApiActivity {
//   id: string;
//   type: string;
//   status: RequestStatus | null;
//   title: string;
//   description: string | null;
//   createdAt: string;
// }

// interface RequestsApiResponse {
//   success: boolean;
//   requests?: ApiWasteRequest[];
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
//   };
//   error?: string;
// }

// interface ActivityItem {
//   id: string;
//   title: string;
//   description: string;
//   time: string;
//   status: RequestStatus;
// }

// // const initialRequests: PickupRequest[] = [
// //   {
// //     id: "req-001",
// //     reference: "WR-1024",
// //     wasteType: "Household Waste",
// //     pickupAddress: "25 Paradise Street, Coventry, CV1 2JU",
// //     preferredDate: "2026-07-24T09:00:00.000Z",
// //     createdAt: "2026-07-18T10:00:00.000Z",
// //     status: "PENDING",
// //     collectorName: null,
// //     collectionWindow: "9:00 AM – 12:00 PM",
// //     notes: "Three household waste bags ready for collection.",
// //   },
// //   {
// //     id: "req-002",
// //     reference: "WR-1023",
// //     wasteType: "Plastic Waste",
// //     pickupAddress: "14 Far Gosford Street, Coventry, CV1 5DW",
// //     preferredDate: "2026-07-22T11:00:00.000Z",
// //     createdAt: "2026-07-16T14:30:00.000Z",
// //     status: "APPROVED",
// //     collectorName: null,
// //     collectionWindow: "11:00 AM – 2:00 PM",
// //     notes: "Plastic bottles and food containers.",
// //   },
// //   {
// //     id: "req-003",
// //     reference: "WR-1022",
// //     wasteType: "Garden Waste",
// //     pickupAddress: "81 Walsgrave Road, Coventry, CV2 4ED",
// //     preferredDate: "2026-07-20T10:00:00.000Z",
// //     createdAt: "2026-07-14T09:15:00.000Z",
// //     status: "ASSIGNED",
// //     collectorName: "Daniel Williams",
// //     collectionWindow: "10:00 AM – 1:00 PM",
// //     notes: "Leaves, branches and grass cuttings.",
// //   },
// //   {
// //     id: "req-004",
// //     reference: "WR-1021",
// //     wasteType: "Mixed Recyclables",
// //     pickupAddress: "10 Albany Road, Coventry, CV5 6JU",
// //     preferredDate: "2026-07-18T08:30:00.000Z",
// //     createdAt: "2026-07-12T13:20:00.000Z",
// //     status: "IN_PROGRESS",
// //     collectorName: "Sarah Thompson",
// //     collectionWindow: "8:30 AM – 11:00 AM",
// //     notes: "Cardboard, cans and paper.",
// //   },
// //   {
// //     id: "req-005",
// //     reference: "WR-1020",
// //     wasteType: "Electronic Waste",
// //     pickupAddress: "42 Foleshill Road, Coventry, CV1 4NU",
// //     preferredDate: "2026-07-14T12:00:00.000Z",
// //     createdAt: "2026-07-10T16:45:00.000Z",
// //     status: "COMPLETED",
// //     collectorName: "Michael Brown",
// //     collectionWindow: "12:00 PM – 3:00 PM",
// //     notes: "Old monitor, keyboard and damaged charger.",
// //   },
// //   {
// //     id: "req-006",
// //     reference: "WR-1019",
// //     wasteType: "Household Waste",
// //     pickupAddress: "7 Queen Victoria Road, Coventry, CV1 3JH",
// //     preferredDate: "2026-07-11T09:00:00.000Z",
// //     createdAt: "2026-07-08T11:10:00.000Z",
// //     status: "CANCELED",
// //     collectorName: null,
// //     collectionWindow: "9:00 AM – 12:00 PM",
// //     notes: "Request cancelled by resident.",
// //   },
// //   {
// //     id: "req-007",
// //     reference: "WR-1018",
// //     wasteType: "Garden Waste",
// //     pickupAddress: "36 Gulson Road, Coventry, CV1 2JH",
// //     preferredDate: "2026-07-08T10:00:00.000Z",
// //     createdAt: "2026-07-05T08:45:00.000Z",
// //     status: "REJECTED",
// //     collectorName: null,
// //     collectionWindow: null,
// //     notes: "The selected waste type was not available for that date.",
// //   },
// // ];

// // const activityItems: ActivityItem[] = [
// //   {
// //     id: "activity-1",
// //     title: "Collector assigned",
// //     description: "Daniel Williams was assigned to request WR-1022.",
// //     time: "Today, 9:15 AM",
// //     status: "ASSIGNED",
// //   },
// //   {
// //     id: "activity-2",
// //     title: "Request approved",
// //     description: "Your plastic waste request WR-1023 was approved.",
// //     time: "Yesterday, 2:30 PM",
// //     status: "APPROVED",
// //   },
// //   {
// //     id: "activity-3",
// //     title: "Collection completed",
// //     description: "Electronic waste request WR-1020 was completed.",
// //     time: "14 Jul, 3:12 PM",
// //     status: "COMPLETED",
// //   },
// //   {
// //     id: "activity-4",
// //     title: "New request submitted",
// //     description: "Household waste request WR-1024 was received.",
// //     time: "18 Jul, 10:00 AM",
// //     status: "PENDING",
// //   },
// // ];

// const statusLabels: Record<RequestStatus, string> = {
//   PENDING: "Pending review",
//   APPROVED: "Approved",
//   ASSIGNED: "Collector assigned",
//   IN_PROGRESS: "Collection in progress",
//   COMPLETED: "Completed",
//   CANCELED: "Cancelled",
//   REJECTED: "Rejected",
// };

// const statusStyles: Record<RequestStatus, string> = {
//   PENDING: "bg-amber-50 text-amber-700 border-amber-200",
//   APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
//   ASSIGNED: "bg-violet-50 text-violet-700 border-violet-200",
//   IN_PROGRESS: "bg-cyan-50 text-cyan-700 border-cyan-200",
//   COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
//   CANCELED: "bg-gray-100 text-gray-600 border-gray-200",
//   REJECTED: "bg-red-50 text-red-700 border-red-200",
// };

// const requestViewOptions: {
//   label: string;
//   value: RequestView;
//   description: string;
// }[] = [
//   {
//     label: "Upcoming",
//     value: "UPCOMING",
//     description: "Assigned and active collections",
//   },
//   {
//     label: "Waiting",
//     value: "WAITING",
//     description: "Requests awaiting action",
//   },
//   {
//     label: "History",
//     value: "HISTORY",
//     description: "Past and closed requests",
//   },
// ];

// const progressStages = [
//   "Requested",
//   "Reviewed",
//   "Assigned",
//   "Collection",
//   "Completed",
// ];

// function formatDate(date: string) {
//   return new Intl.DateTimeFormat("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   }).format(new Date(date));
// }

// function formatLongDate(date: string) {
//   return new Intl.DateTimeFormat("en-GB", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//   }).format(new Date(date));
// }

// function getStatusStep(status: RequestStatus) {
//   const steps: Record<RequestStatus, number> = {
//     PENDING: 1,
//     APPROVED: 2,
//     ASSIGNED: 3,
//     IN_PROGRESS: 4,
//     COMPLETED: 5,
//     CANCELED: 1,
//     REJECTED: 1,
//   };

//   return steps[status];
// }

// function getRequestView(status: RequestStatus): RequestView {
//   if (status === "ASSIGNED" || status === "IN_PROGRESS") {
//     return "UPCOMING";
//   }

//   if (status === "PENDING" || status === "APPROVED") {
//     return "WAITING";
//   }

//   return "HISTORY";
// }

// function getWasteIcon(wasteType: string) {
//   const normalized = wasteType.toLowerCase();

//   if (normalized.includes("garden")) {
//     return Leaf;
//   }

//   if (normalized.includes("electronic")) {
//     return Laptop;
//   }

//   if (
//     normalized.includes("plastic") ||
//     normalized.includes("recycl")
//   ) {
//     return Recycle;
//   }

//   return Home;
// }

// function getWasteAccent(wasteType: string) {
//   const normalized = wasteType.toLowerCase();

//   if (normalized.includes("garden")) {
//     return "bg-lime-50 text-lime-700";
//   }

//   if (normalized.includes("electronic")) {
//     return "bg-indigo-50 text-indigo-700";
//   }

//   if (normalized.includes("plastic")) {
//     return "bg-sky-50 text-sky-700";
//   }

//   if (normalized.includes("recycl")) {
//     return "bg-teal-50 text-teal-700";
//   }

//   return "bg-amber-50 text-amber-700";
// }

// export default function MyRequests() {
//   const router = useRouter();

//  const [requests, setRequests] = useState<PickupRequest[]>([]);
//  const [activities, setActivities] = useState<ActivityItem[]>([]);
//  const [isLoading, setIsLoading] = useState(true);
//  const [error, setError] = useState<string | null>(null);
//  const [selectedView, setSelectedView] = useState<RequestView>("UPCOMING");
//  const [searchTerm, setSearchTerm] = useState("");
//  const [cancelTarget, setCancelTarget] = useState<PickupRequest | null>(null);

//   const currentPickup = useMemo(() => {
//     const priority: RequestStatus[] = [
//       "IN_PROGRESS",
//       "ASSIGNED",
//       "APPROVED",
//       "PENDING",
//     ];

//     return [...requests]
//       .filter((request) => priority.includes(request.status))
//       .sort((first, second) => {
//         const firstPriority = priority.indexOf(first.status);
//         const secondPriority = priority.indexOf(second.status);

//         if (firstPriority !== secondPriority) {
//           return firstPriority - secondPriority;
//         }

//         return (
//           new Date(first.preferredDate).getTime() -
//           new Date(second.preferredDate).getTime()
//         );
//       })[0];
//   }, [requests]);

//   const filteredRequests = useMemo(() => {
//     const normalizedSearch = searchTerm.trim().toLowerCase();

//     return requests.filter((request) => {
//       const matchesView =
//         getRequestView(request.status) === selectedView;

//       const matchesSearch =
//         !normalizedSearch ||
//         request.reference.toLowerCase().includes(normalizedSearch) ||
//         request.wasteType.toLowerCase().includes(normalizedSearch) ||
//         request.pickupAddress.toLowerCase().includes(normalizedSearch) ||
//         request.collectorName
//           ?.toLowerCase()
//           .includes(normalizedSearch);

//       return matchesView && matchesSearch;
//     });
//   }, [requests, searchTerm, selectedView]);

//   const summary = useMemo(() => {
//     const active = requests.filter((request) =>
//       [
//         "PENDING",
//         "APPROVED",
//         "ASSIGNED",
//         "IN_PROGRESS",
//       ].includes(request.status),
//     ).length;

//     const completedThisMonth = requests.filter(
//       (request) => request.status === "COMPLETED",
//     ).length;

//     return {
//       total: requests.length,
//       active,
//       completedThisMonth,
//     };
//   }, [requests]);

//   function canEdit(status: RequestStatus) {
//     return status === "PENDING";
//   }

//   function canCancel(status: RequestStatus) {
//     return status === "PENDING" || status === "APPROVED";
//   }

//   function handleCancelRequest() {
//     if (!cancelTarget) {
//       return;
//     }

//     setRequests((currentRequests) =>
//       currentRequests.map((request) =>
//         request.id === cancelTarget.id
//           ? {
//               ...request,
//               status: "CANCELED",
//             }
//           : request,
//       ),
//     );

//     setCancelTarget(null);
//   }

//   return (
//     <>
//       <main className="min-h-screen bg-[#f4f7f2]">
//         <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
//           <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
//             <div>
//               <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
//                 Collection centre
//               </p>

//               <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
//                 My Collections
//               </h1>

//               <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
//                 Follow your collection journey, review upcoming
//                 pickups and manage your requests.
//               </p>
//             </div>

//             <div className="flex flex-col gap-3 sm:items-end">
//               <p className="text-sm text-gray-500">
//                 <span className="font-semibold text-gray-900">
//                   {summary.total} requests
//                 </span>
//                 {" · "}
//                 {summary.active} active
//                 {" · "}
//                 {summary.completedThisMonth} completed
//               </p>

//               <button
//                 type="button"
//                 onClick={() => router.push("/user/requests/new")}
//                 className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
//               >
//                 <Plus size={18} />
//                 Request a pickup
//               </button>
//             </div>
//           </header>

//           {currentPickup ? (
//             <CurrentPickupSpotlight
//               request={currentPickup}
//               onView={() =>
//                 router.push(
//                   `/user/requests/${currentPickup.id}`,
//                 )
//               }
//               onEdit={() =>
//                 router.push(
//                   `/user/requests/${currentPickup.id}/edit`,
//                 )
//               }
//               onCancel={() => setCancelTarget(currentPickup)}
//               canEdit={canEdit(currentPickup.status)}
//               canCancel={canCancel(currentPickup.status)}
//             />
//           ) : (
//             <NoCurrentPickup
//               onCreate={() => router.push("/user/requests/new")}
//             />
//           )}

//           <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
//             <section className="min-w-0">
//               <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
//                 <div className="border-b border-gray-100 p-4 sm:p-6">
//                   <div className="flex flex-col gap-5">
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                       <div>
//                         <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
//                           Your request board
//                         </p>

//                         <h2 className="mt-1 text-xl font-bold text-gray-950">
//                           Collection requests
//                         </h2>
//                       </div>

//                       <div className="relative w-full lg:max-w-sm">
//                         <Search
//                           size={18}
//                           className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
//                         />

//                         <input
//                           type="search"
//                           value={searchTerm}
//                           onChange={(event) =>
//                             setSearchTerm(event.target.value)
//                           }
//                           placeholder="Search your requests"
//                           className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
//                         />

//                         {searchTerm && (
//                           <button
//                             type="button"
//                             onClick={() => setSearchTerm("")}
//                             aria-label="Clear search"
//                             className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
//                           >
//                             <X size={15} />
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     <div className="grid gap-2 rounded-2xl bg-gray-100 p-1.5 sm:grid-cols-3">
//                       {requestViewOptions.map((option) => {
//                         const selected =
//                           selectedView === option.value;

//                         return (
//                           <button
//                             key={option.value}
//                             type="button"
//                             onClick={() =>
//                               setSelectedView(option.value)
//                             }
//                             className={`rounded-xl px-4 py-3 text-left transition ${
//                               selected
//                                 ? "bg-white shadow-sm"
//                                 : "hover:bg-white/60"
//                             }`}
//                           >
//                             <span
//                               className={`block text-sm font-bold ${
//                                 selected
//                                   ? "text-green-800"
//                                   : "text-gray-700"
//                               }`}
//                             >
//                               {option.label}
//                             </span>

//                             <span className="mt-0.5 block text-xs text-gray-500">
//                               {option.description}
//                             </span>
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="p-4 sm:p-6">
//                   {filteredRequests.length > 0 ? (
//                     <div className="grid gap-5 lg:grid-cols-2">
//                       {filteredRequests.map((request) => (
//                         <RequestTicket
//                           key={request.id}
//                           request={request}
//                           canEdit={canEdit(request.status)}
//                           canCancel={canCancel(request.status)}
//                           onView={() =>
//                             router.push(
//                               `/user/requests/${request.id}`,
//                             )
//                           }
//                           onEdit={() =>
//                             router.push(
//                               `/user/requests/${request.id}/edit`,
//                             )
//                           }
//                           onCancel={() =>
//                             setCancelTarget(request)
//                           }
//                         />
//                       ))}
//                     </div>
//                   ) : (
//                     <EmptyRequestView
//                       view={selectedView}
//                       hasSearch={Boolean(searchTerm)}
//                       onClearSearch={() => setSearchTerm("")}
//                       onCreate={() =>
//                         router.push("/user/requests/new")
//                       }
//                     />
//                   )}
//                 </div>
//               </div>
//             </section>

//             <aside className="xl:sticky xl:top-6 xl:self-start">
//               <ActivityRail activities={activityItems} />
//             </aside>
//           </div>
//         </div>
//       </main>

//       {cancelTarget && (
//         <CancelRequestModal
//           request={cancelTarget}
//           onClose={() => setCancelTarget(null)}
//           onConfirm={handleCancelRequest}
//         />
//       )}
//     </>
//   );
// }

// function CurrentPickupSpotlight({
//   request,
//   onView,
//   onEdit,
//   onCancel,
//   canEdit,
//   canCancel,
// }: {
//   request: PickupRequest;
//   onView: () => void;
//   onEdit: () => void;
//   onCancel: () => void;
//   canEdit: boolean;
//   canCancel: boolean;
// }) {
//   const WasteIcon = getWasteIcon(request.wasteType);
//   const currentStep = getStatusStep(request.status);

//   return (
//     <section className="relative overflow-hidden rounded-[32px] bg-gray-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
//       <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
//       <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

//       <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
//         <div>
//           <div className="flex flex-wrap items-center gap-3">
//             <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-200">
//               <Truck size={14} />
//               Your next collection
//             </span>

//             <StatusBadge status={request.status} dark />
//           </div>

//           <div className="mt-7 flex items-start gap-4">
//             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-950">
//               <WasteIcon size={27} />
//             </div>

//             <div>
//               <p className="text-sm font-medium text-gray-400">
//                 {request.reference}
//               </p>

//               <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
//                 {request.wasteType}
//               </h2>

//               <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-300">
//                 <MapPin
//                   size={17}
//                   className="mt-0.5 shrink-0 text-green-300"
//                 />
//                 {request.pickupAddress}
//               </p>
//             </div>
//           </div>

//           <div className="mt-8 grid gap-4 sm:grid-cols-2">
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//               <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
//                 <CalendarDays size={15} />
//                 Collection date
//               </div>

//               <p className="mt-2 text-lg font-bold text-white">
//                 {formatLongDate(request.preferredDate)}
//               </p>

//               <p className="mt-1 text-sm text-gray-400">
//                 {request.collectionWindow ??
//                   "Collection window pending"}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//               <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
//                 <UserRound size={15} />
//                 Collector
//               </div>

//               <p className="mt-2 text-lg font-bold text-white">
//                 {request.collectorName ?? "Not assigned yet"}
//               </p>

//               <p className="mt-1 text-sm text-gray-400">
//                 {request.collectorName
//                   ? "Your collector has been confirmed"
//                   : "We will notify you when assigned"}
//               </p>
//             </div>
//           </div>

//           <div className="mt-8">
//             <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
//               Collection journey
//             </p>

//             <div className="mt-4 grid grid-cols-5">
//               {progressStages.map((stage, index) => {
//                 const step = index + 1;
//                 const completed = step < currentStep;
//                 const current = step === currentStep;
//                 const last = index === progressStages.length - 1;

//                 return (
//                   <div
//                     key={stage}
//                     className="relative flex flex-col items-center text-center"
//                   >
//                     {!last && (
//                       <div
//                         className={`absolute left-1/2 top-4 h-0.5 w-full ${
//                           step < currentStep
//                             ? "bg-green-400"
//                             : "bg-white/15"
//                         }`}
//                       />
//                     )}

//                     <div
//                       className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${
//                         completed
//                           ? "border-green-400 bg-green-400 text-gray-950"
//                           : current
//                             ? "border-white bg-white text-gray-950"
//                             : "border-white/20 bg-gray-950 text-gray-500"
//                       }`}
//                     >
//                       {completed ? (
//                         <Check size={15} strokeWidth={3} />
//                       ) : current ? (
//                         <Circle
//                           size={9}
//                           fill="currentColor"
//                           strokeWidth={0}
//                         />
//                       ) : (
//                         <span className="text-xs font-bold">
//                           {step}
//                         </span>
//                       )}
//                     </div>

//                     <span
//                       className={`mt-2 hidden text-[11px] font-medium sm:block ${
//                         completed || current
//                           ? "text-white"
//                           : "text-gray-500"
//                       }`}
//                     >
//                       {stage}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
//           <div>
//             <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-300">
//               Current update
//             </p>

//             <h3 className="mt-3 text-xl font-bold leading-snug">
//               {statusLabels[request.status]}
//             </h3>

//             <p className="mt-3 text-sm leading-6 text-gray-300">
//               {getStatusMessage(request)}
//             </p>
//           </div>

//           <div className="mt-8 space-y-3">
//             <button
//               type="button"
//               onClick={onView}
//               className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-green-100"
//             >
//               View request details
//               <ArrowRight size={17} />
//             </button>

//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
//               {canEdit && (
//                 <button
//                   type="button"
//                   onClick={onEdit}
//                   className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
//                 >
//                   <Pencil size={16} />
//                   Edit request
//                 </button>
//               )}

//               {canCancel && (
//                 <button
//                   type="button"
//                   onClick={onCancel}
//                   className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
//                 >
//                   <Trash2 size={16} />
//                   Cancel request
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function RequestTicket({
//   request,
//   canEdit,
//   canCancel,
//   onView,
//   onEdit,
//   onCancel,
// }: {
//   request: PickupRequest;
//   canEdit: boolean;
//   canCancel: boolean;
//   onView: () => void;
//   onEdit: () => void;
//   onCancel: () => void;
// }) {
//   const WasteIcon = getWasteIcon(request.wasteType);

//   return (
//     <article className="group relative overflow-hidden rounded-[24px] border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
//       <div
//         className={`absolute inset-y-0 left-0 w-1.5 ${
//           request.status === "COMPLETED"
//             ? "bg-emerald-500"
//             : request.status === "CANCELED"
//               ? "bg-gray-400"
//               : request.status === "REJECTED"
//                 ? "bg-red-500"
//                 : request.status === "IN_PROGRESS"
//                   ? "bg-cyan-500"
//                   : request.status === "ASSIGNED"
//                     ? "bg-violet-500"
//                     : request.status === "APPROVED"
//                       ? "bg-blue-500"
//                       : "bg-amber-500"
//         }`}
//       />

//       <div className="p-5 pl-6">
//         <div className="flex items-start justify-between gap-4">
//           <div
//             className={`flex h-11 w-11 items-center justify-center rounded-2xl ${getWasteAccent(
//               request.wasteType,
//             )}`}
//           >
//             <WasteIcon size={22} />
//           </div>

//           <StatusBadge status={request.status} />
//         </div>

//         <div className="mt-5">
//           <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
//             {request.reference}
//           </p>

//           <h3 className="mt-1 text-lg font-black text-gray-950">
//             {request.wasteType}
//           </h3>
//         </div>

//         <div className="my-5 flex items-center gap-2">
//           <div className="h-px flex-1 border-t border-dashed border-gray-200" />
//           <div className="h-2 w-2 rounded-full border border-gray-200 bg-gray-50" />
//           <div className="h-px flex-1 border-t border-dashed border-gray-200" />
//         </div>

//         <div className="space-y-3">
//           <div className="flex items-start gap-3">
//             <MapPin
//               size={17}
//               className="mt-0.5 shrink-0 text-gray-400"
//             />

//             <p className="line-clamp-2 text-sm leading-5 text-gray-600">
//               {request.pickupAddress}
//             </p>
//           </div>

//           <div className="flex items-center gap-3">
//             <CalendarDays
//               size={17}
//               className="shrink-0 text-gray-400"
//             />

//             <p className="text-sm text-gray-600">
//               {formatDate(request.preferredDate)}
//             </p>
//           </div>

//           {request.collectorName && (
//             <div className="flex items-center gap-3">
//               <UserRound
//                 size={17}
//                 className="shrink-0 text-gray-400"
//               />

//               <p className="text-sm text-gray-600">
//                 {request.collectorName}
//               </p>
//             </div>
//           )}
//         </div>

//         <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
//           <button
//             type="button"
//             onClick={onView}
//             className="inline-flex items-center gap-2 text-sm font-bold text-green-800 transition hover:text-green-600"
//           >
//             Open request
//             <ChevronRight
//               size={16}
//               className="transition group-hover:translate-x-1"
//             />
//           </button>

//           <div className="flex items-center gap-1">
//             {canEdit && (
//               <button
//                 type="button"
//                 onClick={onEdit}
//                 aria-label={`Edit ${request.reference}`}
//                 className="rounded-full p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
//               >
//                 <Pencil size={16} />
//               </button>
//             )}

//             {canCancel && (
//               <button
//                 type="button"
//                 onClick={onCancel}
//                 aria-label={`Cancel ${request.reference}`}
//                 className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
//               >
//                 <Trash2 size={16} />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </article>
//   );
// }

// function ActivityRail({
//   activities,
// }: {
//   activities: ActivityItem[];
// }) {
//   return (
//     <section className="rounded-[28px] border border-black/5 bg-[#e8efe6] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
//             Activity
//           </p>

//           <h2 className="mt-1 text-xl font-black text-gray-950">
//             Recent updates
//           </h2>
//         </div>

//         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-800">
//           <History size={20} />
//         </div>
//       </div>

//       <div className="mt-7">
//         {activities.map((activity, index) => (
//           <div
//             key={activity.id}
//             className="relative flex gap-4 pb-7 last:pb-0"
//           >
//             {index !== activities.length - 1 && (
//               <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-green-900/15" />
//             )}

//             <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
//               <span
//                 className={`h-2.5 w-2.5 rounded-full ${
//                   activity.status === "COMPLETED"
//                     ? "bg-emerald-500"
//                     : activity.status === "ASSIGNED"
//                       ? "bg-violet-500"
//                       : activity.status === "APPROVED"
//                         ? "bg-blue-500"
//                         : "bg-amber-500"
//                 }`}
//               />
//             </div>

//             <div className="min-w-0">
//               <h3 className="text-sm font-bold text-gray-950">
//                 {activity.title}
//               </h3>

//               <p className="mt-1 text-sm leading-5 text-gray-600">
//                 {activity.description}
//               </p>

//               <p className="mt-2 text-xs font-medium text-gray-400">
//                 {activity.time}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="mt-7 rounded-2xl bg-white/75 p-4">
//         <div className="flex items-start gap-3">
//           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
//             <Clock3 size={18} />
//           </div>

//           <div>
//             <p className="text-sm font-bold text-gray-900">
//               Keep your waste ready
//             </p>

//             <p className="mt-1 text-xs leading-5 text-gray-500">
//               Place your waste outside shortly before the scheduled
//               collection window.
//             </p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function StatusBadge({
//   status,
//   dark = false,
// }: {
//   status: RequestStatus;
//   dark?: boolean;
// }) {
//   if (dark) {
//     return (
//       <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
//         {statusLabels[status]}
//       </span>
//     );
//   }

//   return (
//     <span
//       className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
//     >
//       {statusLabels[status]}
//     </span>
//   );
// }

// function EmptyRequestView({
//   view,
//   hasSearch,
//   onClearSearch,
//   onCreate,
// }: {
//   view: RequestView;
//   hasSearch: boolean;
//   onClearSearch: () => void;
//   onCreate: () => void;
// }) {
//   const messages: Record<
//     RequestView,
//     {
//       title: string;
//       description: string;
//     }
//   > = {
//     UPCOMING: {
//       title: "No upcoming collections",
//       description:
//         "Your assigned and active collections will appear here.",
//     },
//     WAITING: {
//       title: "Nothing is waiting",
//       description:
//         "You currently have no requests waiting for review or approval.",
//     },
//     HISTORY: {
//       title: "No collection history",
//       description:
//         "Completed, cancelled and rejected requests will appear here.",
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center py-16 text-center">
//       <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-800">
//         <PackageCheck size={29} />
//       </div>

//       <h3 className="mt-5 text-xl font-black text-gray-950">
//         {hasSearch
//           ? "No matching requests"
//           : messages[view].title}
//       </h3>

//       <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
//         {hasSearch
//           ? "Try another request reference, waste type, address or collector name."
//           : messages[view].description}
//       </p>

//       <button
//         type="button"
//         onClick={hasSearch ? onClearSearch : onCreate}
//         className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
//       >
//         {hasSearch ? (
//           <>
//             <X size={17} />
//             Clear search
//           </>
//         ) : (
//           <>
//             <Plus size={17} />
//             Request a pickup
//           </>
//         )}
//       </button>
//     </div>
//   );
// }

// function NoCurrentPickup({
//   onCreate,
// }: {
//   onCreate: () => void;
// }) {
//   return (
//     <section className="rounded-[32px] bg-gray-950 px-6 py-12 text-center text-white sm:px-10">
//       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-green-300">
//         <Truck size={30} />
//       </div>

//       <h2 className="mt-5 text-2xl font-black">
//         No active collection
//       </h2>

//       <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
//         Submit a pickup request and track every stage of the
//         collection journey from this page.
//       </p>

//       <button
//         type="button"
//         onClick={onCreate}
//         className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-green-100"
//       >
//         <Plus size={17} />
//         Request a pickup
//       </button>
//     </section>
//   );
// }

// function CancelRequestModal({
//   request,
//   onClose,
//   onConfirm,
// }: {
//   request: PickupRequest;
//   onClose: () => void;
//   onConfirm: () => void;
// }) {
//   return (
//     <div
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="cancel-request-title"
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
//     >
//       <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
//         <div className="flex items-start justify-between gap-4">
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
//             <Trash2 size={22} />
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Close modal"
//             className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <h2
//           id="cancel-request-title"
//           className="mt-5 text-2xl font-black text-gray-950"
//         >
//           Cancel this request?
//         </h2>

//         <p className="mt-3 text-sm leading-6 text-gray-500">
//           Request{" "}
//           <span className="font-bold text-gray-800">
//             {request.reference}
//           </span>{" "}
//           will be marked as cancelled. It will remain available in
//           your collection history.
//         </p>

//         <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
//           <button
//             type="button"
//             onClick={onClose}
//             className="rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
//           >
//             Keep request
//           </button>

//           <button
//             type="button"
//             onClick={onConfirm}
//             className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
//           >
//             Cancel request
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function getStatusMessage(request: PickupRequest) {
//   const messages: Record<RequestStatus, string> = {
//     PENDING:
//       "Your request has been received and is waiting to be reviewed.",
//     APPROVED:
//       "Your request has been approved. A collector will be assigned shortly.",
//     ASSIGNED: `${request.collectorName ?? "A collector"} has been assigned to your request.`,
//     IN_PROGRESS:
//       "Your collector is currently handling this collection.",
//     COMPLETED:
//       "Your waste collection has been completed successfully.",
//     CANCELED:
//       "This request was cancelled and no collection will take place.",
//     REJECTED:
//       "This request could not be approved. View the request for more information.",
//   };

//   return messages[request.status];
// }





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