-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "medical_history" TEXT;

-- AlterTable
ALTER TABLE "visit_records" ADD COLUMN     "symptoms" TEXT;
