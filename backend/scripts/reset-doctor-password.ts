
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'dr.sharma@healthfirst.clinic';
    const newPassword = 'Password@123';

    try {
        console.log(`🔄 Resetting password for ${email}...`);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error('❌ User not found');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        });

        console.log('✅ Password reset successful');
    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
