import { PrismaClient, UserRole, Gender, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data (in reverse order of dependencies)
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.visitRecord.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.patientClinic.deleteMany();
    await prisma.doctorSpecialist.deleteMany();
    await prisma.doctorClinic.deleteMany();
    await prisma.specialist.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.clinic.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Hash password for all users
    const passwordHash = await bcrypt.hash('Password@123', 12);

    // Create Super Admin
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@cliniccrm.com',
            passwordHash,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
        },
    });
    console.log('👑 Created Super Admin:', superAdmin.email);

    // Create Clinic 1
    const clinic1 = await prisma.clinic.create({
        data: {
            name: 'HealthFirst Medical Center',
            address: '123 Medical Plaza, Mumbai, Maharashtra 400001',
            phone: '+91-22-1234-5678',
            email: 'contact@healthfirst.clinic',
            googleReviewUrl: 'https://g.page/r/healthfirst/review',
            settings: {
                timezone: 'Asia/Kolkata',
                slotDuration: 30,
                bookingAdvanceDays: 30,
                cancelBeforeHours: 4,
            },
        },
    });
    console.log('🏥 Created Clinic:', clinic1.name);

    // Create Clinic 2
    const clinic2 = await prisma.clinic.create({
        data: {
            name: 'CarePlus Clinic',
            address: '456 Health Avenue, Pune, Maharashtra 411001',
            phone: '+91-20-9876-5432',
            email: 'info@careplus.clinic',
            googleReviewUrl: 'https://g.page/r/careplus/review',
            settings: {
                timezone: 'Asia/Kolkata',
                slotDuration: 20,
                bookingAdvanceDays: 14,
                cancelBeforeHours: 2,
            },
        },
    });
    console.log('🏥 Created Clinic:', clinic2.name);

    // Create Clinic Admin for Clinic 1
    const clinicAdmin1 = await prisma.user.create({
        data: {
            email: 'admin@healthfirst.clinic',
            passwordHash,
            role: UserRole.CLINIC_ADMIN,
            clinicId: clinic1.id,
            isActive: true,
        },
    });
    console.log('👤 Created Clinic Admin:', clinicAdmin1.email);

    // Create Specialists for Clinic 1
    const generalMedicine = await prisma.specialist.create({
        data: {
            name: 'General Medicine',
            description: 'Primary care and general health consultations',
            clinicId: clinic1.id,
        },
    });

    const cardiology = await prisma.specialist.create({
        data: {
            name: 'Cardiology',
            description: 'Heart and cardiovascular system specialists',
            clinicId: clinic1.id,
        },
    });

    const dermatology = await prisma.specialist.create({
        data: {
            name: 'Dermatology',
            description: 'Skin, hair, and nail specialists',
            clinicId: clinic1.id,
        },
    });

    const pediatrics = await prisma.specialist.create({
        data: {
            name: 'Pediatrics',
            description: 'Child healthcare specialists',
            clinicId: clinic1.id,
        },
    });
    console.log('🩺 Created Specialists for Clinic 1');

    // Create Specialists for Clinic 2
    await prisma.specialist.createMany({
        data: [
            { name: 'General Medicine', description: 'Primary care', clinicId: clinic2.id },
            { name: 'Orthopedics', description: 'Bone and joint specialists', clinicId: clinic2.id },
            { name: 'ENT', description: 'Ear, Nose, and Throat specialists', clinicId: clinic2.id },
        ],
    });
    console.log('🩺 Created Specialists for Clinic 2');

    // Create Doctors for Clinic 1
    const doctor1User = await prisma.user.create({
        data: {
            email: 'dr.sharma@healthfirst.clinic',
            passwordHash,
            role: UserRole.DOCTOR,
            clinicId: clinic1.id,
            isActive: true,
        },
    });

    const doctor1 = await prisma.doctor.create({
        data: {
            userId: doctor1User.id,
            name: 'Dr. Rajesh Sharma',
            qualification: 'MBBS, MD (General Medicine)',
            licenseNumber: 'MH-MED-12345',
            phone: '+91-98765-43210',
        },
    });

    // Associate doctor with clinic and schedule
    await prisma.doctorClinic.create({
        data: {
            doctorId: doctor1.id,
            clinicId: clinic1.id,
            schedule: {
                monday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                tuesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                wednesday: { startTime: '09:00', endTime: '13:00', slotDuration: 30 },
                thursday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                friday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                saturday: { startTime: '10:00', endTime: '14:00', slotDuration: 30 },
            },
        },
    });

    // Associate doctor with specialist
    await prisma.doctorSpecialist.create({
        data: {
            doctorId: doctor1.id,
            specialistId: generalMedicine.id,
        },
    });
    console.log('👨‍⚕️ Created Doctor:', doctor1.name);

    // Create Doctor 2 - Cardiologist
    const doctor2User = await prisma.user.create({
        data: {
            email: 'dr.patel@healthfirst.clinic',
            passwordHash,
            role: UserRole.DOCTOR,
            clinicId: clinic1.id,
            isActive: true,
        },
    });

    const doctor2 = await prisma.doctor.create({
        data: {
            userId: doctor2User.id,
            name: 'Dr. Priya Patel',
            qualification: 'MBBS, DM (Cardiology)',
            licenseNumber: 'MH-CAR-67890',
            phone: '+91-98765-12345',
        },
    });

    await prisma.doctorClinic.create({
        data: {
            doctorId: doctor2.id,
            clinicId: clinic1.id,
            schedule: {
                monday: { startTime: '10:00', endTime: '18:00', slotDuration: 45 },
                wednesday: { startTime: '10:00', endTime: '18:00', slotDuration: 45 },
                friday: { startTime: '10:00', endTime: '16:00', slotDuration: 45 },
            },
        },
    });

    await prisma.doctorSpecialist.create({
        data: {
            doctorId: doctor2.id,
            specialistId: cardiology.id,
        },
    });
    console.log('👨‍⚕️ Created Doctor:', doctor2.name);

    // Create Sample Patients (registered by clinic)
    const patient1 = await prisma.patient.create({
        data: {
            name: 'Amit Kumar',
            phone: '+91-98765-00001',
            dob: new Date('1985-05-15'),
            gender: Gender.MALE,
            whatsappConsent: true,
            consentAt: new Date(),
        },
    });

    await prisma.patientClinic.create({
        data: {
            patientId: patient1.id,
            clinicId: clinic1.id,
        },
    });

    const patient2 = await prisma.patient.create({
        data: {
            name: 'Sunita Devi',
            phone: '+91-98765-00002',
            dob: new Date('1990-08-22'),
            gender: Gender.FEMALE,
            whatsappConsent: true,
            consentAt: new Date(),
        },
    });

    await prisma.patientClinic.create({
        data: {
            patientId: patient2.id,
            clinicId: clinic1.id,
        },
    });
    console.log('👥 Created Sample Patients');

    // Create Sample Appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const appointment1 = await prisma.appointment.create({
        data: {
            clinicId: clinic1.id,
            patientId: patient1.id,
            doctorId: doctor1.id,
            specialistId: generalMedicine.id,
            appointmentDate: tomorrow,
            startTime: new Date('1970-01-01T10:00:00'),
            endTime: new Date('1970-01-01T10:30:00'),
            status: AppointmentStatus.CONFIRMED,
            idempotencyKey: uuidv4(),
        },
    });
    console.log('📅 Created Sample Appointment');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('-----------------------------------');
    console.log('Super Admin: admin@cliniccrm.com / Password@123');
    console.log('Clinic Admin: admin@healthfirst.clinic / Password@123');
    console.log('Doctor: dr.sharma@healthfirst.clinic / Password@123');
    console.log('Doctor: dr.patel@healthfirst.clinic / Password@123');
    console.log('-----------------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
