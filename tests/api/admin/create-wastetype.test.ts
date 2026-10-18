
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { WasteStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  verifyAuth: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  uploadStream: vi.fn(),
}));

vi.mock("@/lib/verifyAuth", () => ({
  verifyAuth: mocks.verifyAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    wasteType: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: mocks.uploadStream,
    },
  },
}));

import { POST } from "@/app/api/admin/create-wastetypes/route";

const createRequest = (
  fields: Record<string, string> = {},
) => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return new Request(
    "http://localhost:3000/api/admin/create-wastetypes",
    {
      method: "POST",
      body: formData,
    },
  );
};

const validFields = {
  name: "General Waste",
  description: "General household waste",
  price: "1000",
  isActive: "true",
};

const createdWasteType = {
  id: "waste-type-001",
  name: "General Waste",
  description: "General household waste",
  price: 1000,
  imageUrl: null,
  status: WasteStatus.ACTIVE,
};

describe("POST /api/admin/create-wastetypes - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAuth.mockResolvedValue({
      id: "admin-001",
      role: "ADMIN",
    });

    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue(createdWasteType);
  });

  it("TC-ADM-WASTE-01: creates a valid waste type", async () => {
    const response = await POST(createRequest(validFields));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Waste type created successfully",
    );

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "General Waste",
        description: "General household waste",
        price: 1000,
        imageUrl: null,
        status: WasteStatus.ACTIVE,
      },
    });
  });

  it("TC-ADM-WASTE-02: rejects unauthenticated users", async () => {
    mocks.verifyAuth.mockResolvedValue(null);

    const response = await POST(createRequest(validFields));
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-03: rejects resident users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "resident-001",
      role: "USER",
    });

    const response = await POST(createRequest(validFields));

    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-04: rejects collector users", async () => {
    mocks.verifyAuth.mockResolvedValue({
      id: "collector-001",
      role: "COLLECTOR",
    });

    const response = await POST(createRequest(validFields));

    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-05: rejects a missing name", async () => {
    const response = await POST(
      createRequest({
        price: "1000",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Name and price are required",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-06: rejects a missing price", async () => {
    const response = await POST(
      createRequest({
        name: "General Waste",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Name and price are required",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });


  it("TC-ADM-WASTE-07: rejects a zero price", async () => {
    const response = await POST(
      createRequest({
        name: "General Waste",
        price: "0",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "Price must be a valid positive number",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });




  it("TC-ADM-WASTE-08: rejects a negative price", async () => {
    const response = await POST(
      createRequest({
        name: "General Waste",
        price: "-100",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBeDefined();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-09: rejects a non-numeric price", async () => {
    const response = await POST(
      createRequest({
        name: "General Waste",
        price: "invalid",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBeDefined();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-10: rejects a whitespace-only name", async () => {
    const response = await POST(
      createRequest({
        name: "   ",
        price: "1000",
        isActive: "true",
      }),
    );

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBeDefined();
    expect(mocks.create).not.toHaveBeenCalled();
  });


  it("TC-ADM-WASTE-11: rejects an existing waste type", async () => {
    mocks.findUnique.mockResolvedValue(createdWasteType);

    const response = await POST(createRequest(validFields));
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Waste type already exists");

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { name: "General Waste" },
    });

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("TC-ADM-WASTE-12: defaults to INACTIVE when isActive is omitted", async () => {
    const response = await POST(
      createRequest({
        name: "Plastic Waste",
        description: "Plastic materials",
        price: "500",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Plastic Waste",
        status: WasteStatus.INACTIVE,
      }),
    });
  });

  it("TC-ADM-WASTE-13: creates an ACTIVE waste type when isActive is true", async () => {
    const response = await POST(
      createRequest({
        name: "Plastic Waste",
        description: "Plastic materials",
        price: "500",
        isActive: "true",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Plastic Waste",
        status: WasteStatus.ACTIVE,
      }),
    });
  });

  it("TC-ADM-WASTE-14: creates an INACTIVE waste type when isActive is false", async () => {
    const response = await POST(
      createRequest({
        name: "Plastic Waste",
        description: "Plastic materials",
        price: "500",
        isActive: "false",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Plastic Waste",
        status: WasteStatus.INACTIVE,
      }),
    });
  });

  it("TC-ADM-WASTE-15: saves the trimmed description correctly", async () => {
    const response = await POST(
      createRequest({
        name: "  Plastic Waste  ",
        description: "  Recyclable plastic materials  ",
        price: "500",
        isActive: "true",
      }),
    );

    expect(response.status).toBe(200);

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Plastic Waste",
        description: "Recyclable plastic materials",
        price: 500,
      }),
    });
  });


  it("TC-ADM-WASTE-16: uploads an image to Cloudinary", async () => {
    const formData = new FormData();

    Object.entries(validFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append(
      "image",
      new File(["fake-image-content"], "waste.png", {
        type: "image/png",
      }),
    );

    mocks.uploadStream.mockImplementation(
      (_options, callback) => ({
        end: vi.fn(() => {
          callback(null, {
            secure_url:
              "https://res.cloudinary.com/test/waste.png",
          });
        }),
      }),
    );

    const request = new Request(
      "http://localhost:3000/api/admin/create-wastetypes",
      {
        method: "POST",
        body: formData,
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);

    expect(mocks.uploadStream).toHaveBeenCalledWith(
      { folder: "waste-types" },
      expect.any(Function),
    );

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        imageUrl:
          "https://res.cloudinary.com/test/waste.png",
      }),
    });
  });

  it("TC-ADM-WASTE-17: creates a waste type without an image", async () => {
    const response = await POST(createRequest(validFields));

    expect(response.status).toBe(200);
    expect(mocks.uploadStream).not.toHaveBeenCalled();

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        imageUrl: null,
      }),
    });
  });

  it("TC-ADM-WASTE-18: handles Cloudinary upload failure", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const formData = new FormData();

      Object.entries(validFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append(
        "image",
        new File(["fake-image-content"], "waste.png", {
          type: "image/png",
        }),
      );

      mocks.uploadStream.mockImplementation(
        (_options, callback) => ({
          end: vi.fn(() => {
            callback(new Error("Cloudinary upload failed"), null);
          }),
        }),
      );

      const request = new Request(
        "http://localhost:3000/api/admin/create-wastetypes",
        {
          method: "POST",
          body: formData,
        },
      );

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Server error");
      expect(mocks.create).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-ADM-WASTE-19: handles database insertion failure", async () => {
    mocks.create.mockRejectedValue(
      new Error("Database insertion failed"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await POST(createRequest(validFields));
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Server error");
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-ADM-WASTE-20: handles duplicate lookup failure", async () => {
    mocks.findUnique.mockRejectedValue(
      new Error("Database lookup failed"),
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await POST(createRequest(validFields));
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Server error");
      expect(mocks.create).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-ADM-WASTE-21: handles malformed multipart form data", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const request = new Request(
        "http://localhost:3000/api/admin/create-wastetypes",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: "invalid multipart body",
        },
      );

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Server error");
      expect(mocks.create).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("TC-ADM-WASTE-22: returns the created waste type in the response", async () => {
    const response = await POST(createRequest(validFields));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe(
      "Waste type created successfully",
    );
    expect(result.wasteType).toEqual(createdWasteType);
  });


});
