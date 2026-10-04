/*
  Warnings:

  - You are about to drop the column `isActive` on the `WasteType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WasteType" DROP COLUMN "isActive",
ADD COLUMN     "status" "WasteStatus" NOT NULL DEFAULT 'ACTIVE';
