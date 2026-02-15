-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED_OFFLINE';

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "address_line_1" TEXT,
ADD COLUMN     "address_line_2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'India',
ADD COLUMN     "dpdp_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dpdp_consent_at" TIMESTAMP(3),
ADD COLUMN     "emergency_name" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "emergency_relationship" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "nominee_name" TEXT,
ADD COLUMN     "nominee_phone" TEXT,
ADD COLUMN     "nominee_relationship" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "patients_created_at_idx" ON "patients"("created_at");
