-- CreateTable
CREATE TABLE "CollectorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectorProfile_userId_key" ON "CollectorProfile"("userId");

-- AddForeignKey
ALTER TABLE "CollectorProfile" ADD CONSTRAINT "CollectorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
