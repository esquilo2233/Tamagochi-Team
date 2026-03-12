const { PrismaClient } = require("@prisma/client");
console.log("import ok");
(async () => {
    try {
        const opts = {};
        const url = process.env.DATABASE_URL;
        if (url) {
            opts.accelerateUrl = url;
        }
        const p = new PrismaClient(opts);
        console.log("client created");
        await p.$disconnect();
        console.log("disconnected");
    } catch (e) {
        console.error("err", e);
        process.exit(1);
    }
})();
