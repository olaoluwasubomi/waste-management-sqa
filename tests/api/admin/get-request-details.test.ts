
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteRequest: {
      findUnique: mocks.findUnique,
    },
  },
}));

import { GET } from "@/app/api/admin/get-requests/[id]/route";

const createRequest = () =>
  new NextRequest(
    "http://localhost:3000/api/admin/get-requests/request-001",
  );

const createContext = (id = "request-001") => ({
  params: Promise.resolve({ id }),
});

const sampleWasteRequest = () => ({
  id: "request-001",
  reference: "WM-001",
  description: "Household waste collection",
  quantity: 2,
  quantityUnit: "BAG",
  status: "APPROVED",
  requestedPickupDate: new Date("2026-10-20T10:00:00Z"),
  scheduledPickupStart: null,
  scheduledPickupEnd: null,
  approvedAt: new Date("2026-10-18T10:00:00Z"),
  assignedAt: null,
  startedAt: null,
  completedAt: null,
  canceledAt: null,
  rejectedAt: null,
  cancellationReason: null,
  rejectionReason: null,
  pickupStreet: "10 Main Street",
  pickupCity: "Coventry",
  pickupState: "West Midlands",
  pickupPostalCode: "CV1 1AA",
  pickupCountry: "United Kingdom",
  createdAt: new Date("2026-10-17T10:00:00Z"),
  updatedAt: new Date("2026-10-18T10:00:00Z"),
  user: {
    id: "resident-001",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phone: null,
    image: null,
    role: "USER",
  },
  wasteType: {
    id: "waste-001",
    name: "General Waste",
    description: "Household waste",
    price: 1000,
    imageUrl: null,
    status: "ACTIVE",
  },
  address: {
    id: "address-001",
    label: "Home",
    street: "10 Main Street",
    city: "Coventry",
    state: "West Midlands",
    postalCode: "CV1 1AA",
    country: "United Kingdom",
    latitude: null,
    longitude: null,
    isDefault: true,
  },
  collector: null,
  payment: null,
  activities: [],
});

describe(
  "GET /api/admin/get-requests/[id] - Unit Tests",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.verifyAuth.mockResolvedValue({
        id: "admin-001",
        role: "ADMIN",
      });

      mocks.findUnique.mockResolvedValue(
        sampleWasteRequest(),
      );
    });

    it("TC-ADM-DET-01: retrieves an existing request successfully", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.request.id).toBe("request-001");
      expect(result.request.reference).toBe("WM-001");
    });

    it("TC-ADM-DET-02: rejects unauthenticated users", async () => {
      mocks.verifyAuth.mockResolvedValue(null);

      const response = await GET(
        createRequest(),
        createContext(),
      );

      expect(response.status).toBe(401);
      expect(mocks.findUnique).not.toHaveBeenCalled();
    });

    it("TC-ADM-DET-03: rejects non-admin users", async () => {
      mocks.verifyAuth.mockResolvedValue({
        id: "resident-001",
        role: "USER",
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      expect(response.status).toBe(403);
      expect(mocks.findUnique).not.toHaveBeenCalled();
    });

    it("TC-ADM-DET-04: rejects an empty request ID", async () => {
      const response = await GET(
        createRequest(),
        createContext(""),
      );

      expect(response.status).toBe(400);
    });

    it("TC-ADM-DET-05: rejects a whitespace-only request ID", async () => {
      const response = await GET(
        createRequest(),
        createContext("   "),
      );

      expect(response.status).toBe(400);
    });

    it("TC-ADM-DET-06: returns 404 for a nonexistent request", async () => {
      mocks.findUnique.mockResolvedValue(null);

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
    });



    it("TC-ADM-DET-07: selects the required request relationships", async () => {
      await GET(createRequest(), createContext());

      expect(mocks.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "request-001",
          },
          select: expect.objectContaining({
            user: expect.any(Object),
            wasteType: expect.any(Object),
            address: expect.any(Object),
            collector: expect.any(Object),
            payment: expect.any(Object),
            activities: expect.objectContaining({
              orderBy: {
                createdAt: "desc",
              },
            }),
          }),
        }),
      );
    });

    it("TC-ADM-DET-08: formats the resident's full name", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.resident.fullName).toBe(
        "Jane Smith",
      );
      expect(result.request.resident.email).toBe(
        "jane@example.com",
      );
    });

    it("TC-ADM-DET-09: formats the assigned collector's full name", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        collector: {
          id: "collector-001",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: null,
          image: null,
          collectorProfile: {
            zone: "Central",
            isActive: true,
            vehicleRegistration: "CV-123",
          },
        },
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.collector.fullName).toBe(
        "John Doe",
      );
      expect(result.request.collector.collectorProfile.zone).toBe(
        "Central",
      );
    });

    it("TC-ADM-DET-10: returns null when no collector is assigned", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.collector).toBeNull();
    });

    it("TC-ADM-DET-11: formats the pickup address correctly", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.pickupAddress.formatted).toBe(
        "10 Main Street, Coventry, West Midlands, CV1 1AA, United Kingdom",
      );
      expect(result.request.pickupAddress.city).toBe(
        "Coventry",
      );
    });

    it("TC-ADM-DET-12: excludes missing optional address fields from formatting", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        pickupState: null,
        pickupPostalCode: null,
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.pickupAddress.formatted).toBe(
        "10 Main Street, Coventry, United Kingdom",
      );
    });

    it("TC-ADM-DET-13: returns saved address details", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.savedAddress).toEqual(
        expect.objectContaining({
          id: "address-001",
          label: "Home",
          isDefault: true,
        }),
      );
    });

    it("TC-ADM-DET-14: returns waste type details", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.wasteType).toEqual(
        expect.objectContaining({
          id: "waste-001",
          name: "General Waste",
          status: "ACTIVE",
        }),
      );
    });

    it("TC-ADM-DET-15: returns payment details when available", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        payment: {
          id: "payment-001",
          amount: 1000,
          status: "PAID",
          transactionRef: "TXN-001",
          paidAt: new Date("2026-10-18T11:00:00Z"),
          failedAt: null,
          refundedAt: null,
          createdAt: new Date("2026-10-18T10:00:00Z"),
          updatedAt: new Date("2026-10-18T11:00:00Z"),
        },
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.payment.id).toBe(
        "payment-001",
      );
      expect(result.request.payment.status).toBe(
        "PAID",
      );
      expect(result.request.payment.transactionRef).toBe(
        "TXN-001",
      );
    });

    it("TC-ADM-DET-16: returns null when no payment exists", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.payment).toBeNull();
    });

    it("TC-ADM-DET-17: returns request activity history", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        activities: [
          {
            id: "activity-001",
            type: "REQUEST_APPROVED",
            status: "APPROVED",
            title: "Request approved",
            description: "Request approved by admin",
            createdAt: new Date("2026-10-18T12:00:00Z"),
            createdBy: {
              id: "admin-001",
              firstName: "Admin",
              lastName: "User",
              role: "ADMIN",
            },
          },
        ],
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.activities).toHaveLength(1);
      expect(result.request.activities[0].title).toBe(
        "Request approved",
      );
    });

    it("TC-ADM-DET-18: formats the activity creator's full name", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        activities: [
          {
            id: "activity-001",
            type: "REQUEST_APPROVED",
            status: "APPROVED",
            title: "Request approved",
            description: null,
            createdAt: new Date("2026-10-18T12:00:00Z"),
            createdBy: {
              id: "admin-001",
              firstName: "Admin",
              lastName: "User",
              role: "ADMIN",
            },
          },
        ],
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(
        result.request.activities[0].createdBy.fullName,
      ).toBe("Admin User");
    });

    it("TC-ADM-DET-19: handles an activity without a creator", async () => {
      mocks.findUnique.mockResolvedValue({
        ...sampleWasteRequest(),
        activities: [
          {
            id: "activity-001",
            type: "REQUEST_CREATED",
            status: "PENDING",
            title: "Request created",
            description: null,
            createdAt: new Date("2026-10-17T10:00:00Z"),
            createdBy: null,
          },
        ],
      });

      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(
        result.request.activities[0].createdBy,
      ).toBeNull();
    });

    it("TC-ADM-DET-20: returns an empty activity history when none exists", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.activities).toEqual([]);
    });

    it("TC-ADM-DET-21: returns request status and lifecycle timestamps", async () => {
      const response = await GET(
        createRequest(),
        createContext(),
      );

      const result = await response.json();

      expect(result.request.status).toBe("APPROVED");
      expect(result.request.approvedAt).toBe(
        "2026-10-18T10:00:00.000Z",
      );
      expect(result.request.assignedAt).toBeNull();
    });

    it("TC-ADM-DET-22: returns 500 when the database query fails", async () => {
      mocks.findUnique.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const response = await GET(
          createRequest(),
          createContext(),
        );

        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Unable to retrieve pickup request details",
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

  },
);
