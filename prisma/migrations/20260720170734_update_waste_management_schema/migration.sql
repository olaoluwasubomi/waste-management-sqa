/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `WasteRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupCity` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupCountry` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupState` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupStreet` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedPickupDate` to the `WasteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WasteType` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WasteQuantityUnit" AS ENUM ('BAG', 'BIN', 'ITEM', 'KILOGRAM', 'TONNE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestActivityType" AS ENUM ('REQUEST_CREATED', 'REQUEST_UPDATED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'COLLECTOR_ASSIGNED', 'COLLECTION_STARTED', 'COLLECTION_COMPLETED', 'REQUEST_CANCELED', 'REQUEST_RESCHEDULED', 'PAYMENT_CREATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WasteRequestStatus" ADD VALUE 'APPROVED';
ALTER TYPE "WasteRequestStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_wasteRequestId_fkey";

-- DropForeignKey
ALTER TABLE "WasteRequest" DROP CONSTRAINT "WasteRequest_userId_fkey";

-- AlterTable
ALTER TABLE "Address"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "label" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Address"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "Address"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "CollectorProfile" ADD COLUMN     "vehicleRegistration" TEXT;

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "failedAt" TIMESTAMP(3),
ADD COLUMN "refundedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Payment"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "Payment"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "WasteRequest"
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "assignedAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "pickupCity" TEXT,
ADD COLUMN "pickupCountry" TEXT,
ADD COLUMN "pickupPostalCode" TEXT,
ADD COLUMN "pickupState" TEXT,
ADD COLUMN "pickupStreet" TEXT,
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "quantityUnit" "WasteQuantityUnit" NOT NULL DEFAULT 'BAG',
ADD COLUMN "reference" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "requestedPickupDate" TIMESTAMP(3),
ADD COLUMN "scheduledPickupEnd" TIMESTAMP(3),
ADD COLUMN "scheduledPickupStart" TIMESTAMP(3),
ADD COLUMN "startedAt" TIMESTAMP(3);

-- Copy the current address into the request snapshot fields
UPDATE "WasteRequest" AS wr
SET
  "pickupStreet" = address."street",
  "pickupCity" = address."city",
  "pickupState" = address."state",
  "pickupPostalCode" = address."postalCode",
  "pickupCountry" = COALESCE(address."country", 'Nigeria')
FROM "Address" AS address
WHERE wr."addressId" = address."id";

-- Generate a unique reference for every existing request
UPDATE "WasteRequest"
SET "reference" = 'WR-' || REPLACE("id", '-', '')
WHERE "reference" IS NULL;

-- Use the original request creation date as the requested pickup date
UPDATE "WasteRequest"
SET "requestedPickupDate" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "requestedPickupDate" IS NULL;

-- Fallback values in case an existing request has no matching address
UPDATE "WasteRequest"
SET
  "pickupStreet" = COALESCE("pickupStreet", 'Unknown'),
  "pickupCity" = COALESCE("pickupCity", 'Unknown'),
  "pickupState" = COALESCE("pickupState", 'Unknown'),
  "pickupCountry" = COALESCE("pickupCountry", 'Nigeria')
WHERE
  "pickupStreet" IS NULL
  OR "pickupCity" IS NULL
  OR "pickupState" IS NULL
  OR "pickupCountry" IS NULL;

-- Make the new fields required after existing rows have been populated
ALTER TABLE "WasteRequest"
ALTER COLUMN "pickupStreet" SET NOT NULL,
ALTER COLUMN "pickupCity" SET NOT NULL,
ALTER COLUMN "pickupState" SET NOT NULL,
ALTER COLUMN "pickupCountry" SET NOT NULL,
ALTER COLUMN "reference" SET NOT NULL,
ALTER COLUMN "requestedPickupDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "WasteType"
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "WasteType"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "WasteType"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "WasteRequestActivity" (
    "id" TEXT NOT NULL,
    "type" "RequestActivityType" NOT NULL,
    "status" "WasteRequestStatus",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasteRequestId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "WasteRequestActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteRequestActivity_wasteRequestId_idx" ON "WasteRequestActivity"("wasteRequestId");

-- CreateIndex
CREATE INDEX "WasteRequestActivity_createdById_idx" ON "WasteRequestActivity"("createdById");

-- CreateIndex
CREATE INDEX "WasteRequestActivity_createdAt_idx" ON "WasteRequestActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "CollectorProfile_zone_idx" ON "CollectorProfile"("zone");

-- CreateIndex
CREATE INDEX "CollectorProfile_isActive_idx" ON "CollectorProfile"("isActive");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WasteRequest_reference_key" ON "WasteRequest"("reference");

-- CreateIndex
CREATE INDEX "WasteRequest_userId_idx" ON "WasteRequest"("userId");

-- CreateIndex
CREATE INDEX "WasteRequest_collectorId_idx" ON "WasteRequest"("collectorId");

-- CreateIndex
CREATE INDEX "WasteRequest_wasteTypeId_idx" ON "WasteRequest"("wasteTypeId");

-- CreateIndex
CREATE INDEX "WasteRequest_addressId_idx" ON "WasteRequest"("addressId");

-- CreateIndex
CREATE INDEX "WasteRequest_status_idx" ON "WasteRequest"("status");

-- CreateIndex
CREATE INDEX "WasteRequest_requestedPickupDate_idx" ON "WasteRequest"("requestedPickupDate");

-- CreateIndex
CREATE INDEX "WasteRequest_createdAt_idx" ON "WasteRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WasteType_status_idx" ON "WasteType"("status");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequest" ADD CONSTRAINT "WasteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequestActivity" ADD CONSTRAINT "WasteRequestActivity_wasteRequestId_fkey" FOREIGN KEY ("wasteRequestId") REFERENCES "WasteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRequestActivity" ADD CONSTRAINT "WasteRequestActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_wasteRequestId_fkey" FOREIGN KEY ("wasteRequestId") REFERENCES "WasteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
