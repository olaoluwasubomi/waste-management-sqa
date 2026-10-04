-- AlterTable
ALTER TABLE "WasteType" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
