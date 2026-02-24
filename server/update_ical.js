const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const newUrl = "https://proseconsult.umontpellier.fr/jsp/custom/modules/plannings/direct_cal.jsp?data=58c99062bab31d256bee14356aca3f2423c0f022cb9660eba051b2653be722c4255dc57febc36bcda019d951db547ac9dc5c094f7d1a811b903031bde802c7f52fd380b992d3771de6139e0d9278c8e91aa43e5f4eeaa642fb89a601c5d38bdbbd1a97b92740a193c1f91bb6cfb329d3cdfc594c44244d95850f846a334216ec,1";

    console.log("Updating iCal URL for DaMS 3A G1...");

    const result = await prisma.user.updateMany({
        where: {
            filiere: "DaMS",
            annee: "3A",
            groupe: "G1"
        },
        data: {
            scheduleUrl: newUrl
        }
    });

    console.log(`Updated ${result.count} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
