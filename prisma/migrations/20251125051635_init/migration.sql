-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "WasteRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,

    CONSTRAINT "WasteType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteRequest" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "status" "WasteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "collectorId" TEXT,
    "wasteTypeId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,

    CONSTRAINT "WasteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "wasteRequestId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WasteType_name_key" ON "WasteType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_wasteRequestId_key" ON "Payment"("wasteRequestId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequest" ADD CONSTRAINT "WasteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequest" ADD CONSTRAINT "WasteRequest_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequest" ADD CONSTRAINT "WasteRequest_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequest" ADD CONSTRAINT "WasteRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_wasteRequestId_fkey" FOREIGN KEY ("wasteRequestId") REFERENCES "WasteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
