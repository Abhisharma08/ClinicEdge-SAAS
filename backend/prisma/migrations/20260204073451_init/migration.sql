-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_CREATED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_REMINDER_24H', 'APPOINTMENT_REMINDER_2H', 'APPOINTMENT_COMPLETED', 'FEEDBACK_REQUEST');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'DASHBOARD', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "clinic_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "google_review_url" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT,
    "license_number" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_clinics" (
    "id" TEXT NOT NULL,
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctor_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "doctor_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "specialists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_specialists" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctor_id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,

    CONSTRAINT "doctor_specialists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_encrypted" TEXT,
    "dob" DATE,
    "dob_encrypted" TEXT,
    "gender" "Gender",
    "whatsapp_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_clinics" (
    "id" TEXT NOT NULL,
    "first_visit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_visit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patient_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "patient_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "appointment_date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "specialist_id" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_records" (
    "id" TEXT NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "follow_up_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "visit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_record_id" TEXT NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_record_id" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "redirected_to_google" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appointment_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinic_id" TEXT NOT NULL,
    "user_id" TEXT,
    "appointment_id" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinic_id" TEXT,
    "user_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_clinic_id_idx" ON "users"("clinic_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "clinics_name_idx" ON "clinics"("name");

-- CreateIndex
CREATE INDEX "clinics_is_active_idx" ON "clinics"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_user_id_key" ON "doctors"("user_id");

-- CreateIndex
CREATE INDEX "doctors_name_idx" ON "doctors"("name");

-- CreateIndex
CREATE INDEX "doctors_is_active_idx" ON "doctors"("is_active");

-- CreateIndex
CREATE INDEX "doctor_clinics_clinic_id_idx" ON "doctor_clinics"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_clinics_doctor_id_clinic_id_key" ON "doctor_clinics"("doctor_id", "clinic_id");

-- CreateIndex
CREATE INDEX "specialists_clinic_id_idx" ON "specialists"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "specialists_clinic_id_name_key" ON "specialists"("clinic_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_specialists_doctor_id_specialist_id_key" ON "doctor_specialists"("doctor_id", "specialist_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_name_idx" ON "patients"("name");

-- CreateIndex
CREATE INDEX "patient_clinics_clinic_id_idx" ON "patient_clinics"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_clinics_patient_id_clinic_id_key" ON "patient_clinics"("patient_id", "clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_idempotency_key_key" ON "appointments"("idempotency_key");

-- CreateIndex
CREATE INDEX "appointments_clinic_id_idx" ON "appointments"("clinic_id");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_clinic_id_doctor_id_appointment_date_idx" ON "appointments"("clinic_id", "doctor_id", "appointment_date");

-- CreateIndex
CREATE UNIQUE INDEX "visit_records_appointment_id_key" ON "visit_records"("appointment_id");

-- CreateIndex
CREATE INDEX "visit_records_clinic_id_idx" ON "visit_records"("clinic_id");

-- CreateIndex
CREATE INDEX "visit_records_patient_id_idx" ON "visit_records"("patient_id");

-- CreateIndex
CREATE INDEX "visit_records_doctor_id_idx" ON "visit_records"("doctor_id");

-- CreateIndex
CREATE INDEX "prescriptions_visit_record_id_idx" ON "prescriptions"("visit_record_id");

-- CreateIndex
CREATE INDEX "attachments_visit_record_id_idx" ON "attachments"("visit_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_token_key" ON "feedback"("token");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_appointment_id_key" ON "feedback"("appointment_id");

-- CreateIndex
CREATE INDEX "feedback_clinic_id_idx" ON "feedback"("clinic_id");

-- CreateIndex
CREATE INDEX "feedback_token_idx" ON "feedback"("token");

-- CreateIndex
CREATE INDEX "notifications_clinic_id_idx" ON "notifications"("clinic_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_channel_status_idx" ON "notifications"("channel", "status");

-- CreateIndex
CREATE INDEX "audit_logs_clinic_id_idx" ON "audit_logs"("clinic_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_clinics" ADD CONSTRAINT "doctor_clinics_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_clinics" ADD CONSTRAINT "doctor_clinics_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_specialists" ADD CONSTRAINT "doctor_specialists_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_specialists" ADD CONSTRAINT "doctor_specialists_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_visit_record_id_fkey" FOREIGN KEY ("visit_record_id") REFERENCES "visit_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_visit_record_id_fkey" FOREIGN KEY ("visit_record_id") REFERENCES "visit_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
