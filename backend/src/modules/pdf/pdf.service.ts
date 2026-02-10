import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
    async generatePrescription(visitRecord: any): Promise<Buffer> {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', (buffer: any) => buffers.push(buffer));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header - Clinic Details
            doc.fontSize(20).text(visitRecord.clinic.name, { align: 'center' });
            doc.fontSize(10).text(visitRecord.clinic.address || '', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text('Prescription', { align: 'center', underline: true });
            doc.moveDown();

            // Doctor & Patient Details
            const yStart = doc.y;
            doc.fontSize(10).text(`Doctor: ${visitRecord.doctor.name}`);
            if (visitRecord.doctor.qualification) {
                doc.text(`Qualification: ${visitRecord.doctor.qualification}`);
            }
            doc.text(`Date: ${new Date(visitRecord.appointment.appointmentDate).toLocaleDateString()}`);

            doc.text(`Patient: ${visitRecord.patient.name}`, 300, yStart);
            doc.text(`Age/Gender: ${this.calculateAge(visitRecord.patient.dob)} / ${visitRecord.patient.gender || '-'}`, 300);
            doc.moveDown(2);

            // Diagnosis
            doc.fontSize(14).text('Diagnosis');
            doc.rect(doc.x, doc.y, 500, 1).stroke();
            doc.moveDown(0.5);
            doc.fontSize(10).text(visitRecord.diagnosis || 'N/A');
            doc.moveDown();

            // Medications
            doc.fontSize(14).text('Medications');
            doc.rect(doc.x, doc.y, 500, 1).stroke();
            doc.moveDown(0.5);

            if (visitRecord.prescriptions && visitRecord.prescriptions.length > 0) {
                // Table Header
                const tableTop = doc.y;
                doc.font('Helvetica-Bold');
                doc.text('Medicine', 50, tableTop);
                doc.text('Dosage', 250, tableTop);
                doc.text('Frequency', 350, tableTop);
                doc.text('Duration', 450, tableTop);
                doc.moveDown();
                doc.font('Helvetica');

                // Table Rows
                visitRecord.prescriptions.forEach((p: any) => {
                    const y = doc.y;
                    doc.text(p.medication, 50, y);
                    doc.text(p.dosage || '-', 250, y);
                    doc.text(p.frequency || '-', 350, y);
                    doc.text(p.duration || '-', 450, y);
                    doc.moveDown();
                });
            } else {
                doc.text('No medications prescribed.');
            }

            doc.moveDown(2);

            // Instructions/Notes
            if (visitRecord.notes) {
                doc.fontSize(14).text('Notes / Instructions');
                doc.rect(doc.x, doc.y, 500, 1).stroke();
                doc.moveDown(0.5);
                doc.fontSize(10).text(visitRecord.notes);
            }

            // Footer
            doc.moveDown(4);
            doc.fontSize(10).text('Signature: __________________________', { align: 'right' });

            doc.end();
        });
    }

    private calculateAge(dob: string | Date): string {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    }
}
