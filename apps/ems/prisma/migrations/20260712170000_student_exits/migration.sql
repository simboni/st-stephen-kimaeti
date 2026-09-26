-- CreateEnum
CREATE TYPE "ExitType" AS ENUM ('TRANSFERRED', 'GRADUATED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "exitAt" TIMESTAMP(3),
ADD COLUMN     "exitBalanceCents" INTEGER,
ADD COLUMN     "exitDestination" TEXT,
ADD COLUMN     "exitType" "ExitType";

