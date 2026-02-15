import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { encrypt } from '../../common/utils/encryption.util';
import * as XLSX from 'xlsx';

const EXPORT_COLUMNS = [
    'firstName', 'lastName', 'phone', 'dob', 'gender', 'email',
    'bloodGroup', 'allergies', 'medicalHistory',
    'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country',
    'emergencyName', 'emergencyRelationship', 'emergencyPhone',
    'nomineeName', 'nomineeRelationship', 'nomineePhone',
];

const REQUIRED_IMPORT_FIELDS = ['firstName', 'lastName', 'phone', 'dob', 'gender'];

@Injectable()
export class ImportExportService {
    private readonly logger = new Logger(ImportExportService.name);
    private readonly encryptionKey: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.encryptionKey = this.configService.get<string>('encryption.key') || '';
    }

    /**
     * Convert patient data to CSV string
     */
    toCSV(patients: any[]): string {
        const header = EXPORT_COLUMNS.join(',');
        const rows = patients.map((p) =>
            EXPORT_COLUMNS.map((col) => {
                let val = p[col] ?? '';
                if (col === 'dob' && val) val = new Date(val).toISOString().split('T')[0];
                // Escape commas and quotes
                val = String(val);
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(','),
        );
        return [header, ...rows].join('\n');
    }

    /**
     * Convert patient data to XLSX buffer
     */
    toExcel(patients: any[]): Buffer {
        const data = patients.map((p) => {
            const row: any = {};
            EXPORT_COLUMNS.forEach((col) => {
                let val = p[col] ?? '';
                if (col === 'dob' && val) val = new Date(val).toISOString().split('T')[0];
                row[col] = val;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Patients');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }

    /**
     * Import patients from uploaded CSV or XLSX file
     */
    async importPatients(file: Express.Multer.File, clinicId: string) {
        let rows: any[];

        try {
            if (file.mimetype === 'text/csv') {
                rows = this.parseCSV(file.buffer.toString('utf-8'));
            } else {
                rows = this.parseExcel(file.buffer);
            }
        } catch (err) {
            throw new BadRequestException('Failed to parse file. Ensure it is a valid CSV or Excel file.');
        }

        if (rows.length === 0) {
            throw new BadRequestException('File contains no data rows');
        }

        const results = { total: rows.length, success: 0, errors: [] as any[] };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // 1-indexed, row 1 is header

            // Validate required fields
            const missing = REQUIRED_IMPORT_FIELDS.filter((f) => !row[f]?.toString().trim());
            if (missing.length > 0) {
                results.errors.push({ row: rowNum, error: `Missing required fields: ${missing.join(', ')}` });
                continue;
            }

            // Validate phone format
            const phone = row.phone?.toString().trim();
            if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
                results.errors.push({ row: rowNum, error: `Invalid phone format: ${phone}` });
                continue;
            }

            // Validate gender
            const gender = row.gender?.toString().trim().toUpperCase();
            if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
                results.errors.push({ row: rowNum, error: `Invalid gender: ${row.gender}` });
                continue;
            }

            try {
                const existing = await this.prisma.patient.findUnique({ where: { phone } });

                if (existing) {
                    // Check if patient was soft-deleted and reactivate
                    if (existing.deletedAt) {
                        await this.prisma.patient.update({
                            where: { id: existing.id },
                            data: {
                                deletedAt: null,
                                isActive: true,
                                // Update basic details on reactivation
                                name: `${row.firstName} ${row.lastName}`.trim(),
                                firstName: row.firstName?.toString().trim(),
                                lastName: row.lastName?.toString().trim(),
                            },
                        });
                    }

                    // Link existing patient to clinic
                    await this.prisma.patientClinic.upsert({
                        where: { patientId_clinicId: { patientId: existing.id, clinicId } },
                        create: { patientId: existing.id, clinicId },
                        update: { lastVisit: new Date() },
                    });
                    results.success++;
                    continue;
                }

                const firstName = row.firstName?.toString().trim();
                const lastName = row.lastName?.toString().trim();

                const patient = await this.prisma.patient.create({
                    data: {
                        name: `${firstName} ${lastName}`.trim(),
                        firstName,
                        lastName,
                        phone,
                        phoneEncrypted: this.encryptionKey ? encrypt(phone, this.encryptionKey) : null,
                        dob: row.dob ? new Date(row.dob) : null,
                        dobEncrypted: row.dob && this.encryptionKey ? encrypt(row.dob.toString(), this.encryptionKey) : null,
                        gender,
                        email: row.email?.toString().trim() || null,
                        bloodGroup: row.bloodGroup?.toString().trim() || null,
                        allergies: row.allergies?.toString().trim() || null,
                        medicalHistory: row.medicalHistory?.toString().trim() || null,
                        addressLine1: row.addressLine1?.toString().trim() || null,
                        addressLine2: row.addressLine2?.toString().trim() || null,
                        city: row.city?.toString().trim() || null,
                        state: row.state?.toString().trim() || null,
                        postalCode: row.postalCode?.toString().trim() || null,
                        country: row.country?.toString().trim() || 'India',
                        emergencyName: row.emergencyName?.toString().trim() || null,
                        emergencyRelationship: row.emergencyRelationship?.toString().trim() || null,
                        emergencyPhone: row.emergencyPhone?.toString().trim() || null,
                        nomineeName: row.nomineeName?.toString().trim() || null,
                        nomineeRelationship: row.nomineeRelationship?.toString().trim() || null,
                        nomineePhone: row.nomineePhone?.toString().trim() || null,
                        dpdpConsent: false,
                    },
                });

                await this.prisma.patientClinic.create({
                    data: { patientId: patient.id, clinicId },
                });

                results.success++;
            } catch (err: any) {
                results.errors.push({ row: rowNum, error: err.message || 'Unknown error' });
            }
        }

        return results;
    }

    private parseCSV(content: string): any[] {
        const lines = content.split('\n').filter((l) => l.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

        return lines.slice(1).map((line) => {
            const values = this.splitCSVLine(line);
            const row: any = {};
            headers.forEach((h, i) => {
                row[h] = values[i]?.trim().replace(/^"|"$/g, '') ?? '';
            });
            return row;
        });
    }

    private splitCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    private parseExcel(buffer: Buffer): any[] {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(ws);
    }
}
