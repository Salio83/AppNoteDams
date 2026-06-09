// Script pour appliquer la migration schedule_event sur la base de données de production
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    try {
        const sql = fs.readFileSync('/app/add_schedule_event_table.sql', 'utf8');

        console.log('Exécution de la migration...');
        await prisma.$executeRawUnsafe(sql);

        console.log('✅ Migration appliquée avec succès !');
        console.log('La table schedule_event a été créée.');
    } catch (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log('✅ La table schedule_event existe déjà.');
        } else {
            console.error('❌ Erreur lors de la migration:', error);
            process.exit(1);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
