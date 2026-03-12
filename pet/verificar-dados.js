import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    host: "db.xsfhngdrhlhrevtucyrq.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "P3eBjbRw4FesBIlc",
});

async function verificarDados() {
    try {
        await client.connect();
        console.log("Conectado ao Supabase!\n");

        const tabelas = [
            "pets",
            "items",
            "game_scores",
            "purchases",
            "people",
            "companion_sessions",
            "work_sessions",
            "samurai_sessions",
            "team_play_rooms",
            "bug_reports",
            "bug_report_files",
            "system_logs",
        ];

        for (const tabela of tabelas) {
            const res = await client.query(
                `SELECT COUNT(*) as count FROM ${tabela}`,
            );
            console.log(`${tabela}: ${res.rows[0].count} registros`);
        }

        // Mostrar alguns dados de exemplo
        console.log("\n=== Pets ===");
        const pets = await client.query(
            "SELECT id, name, hunger, energy, happiness FROM pets LIMIT 5",
        );
        console.log(pets.rows);

        console.log("\n=== People ===");
        const people = await client.query(
            "SELECT id, name, code, coins FROM people LIMIT 5",
        );
        console.log(people.rows);
    } catch (err) {
        console.error("Erro:", err.message);
    } finally {
        await client.end();
    }
}

verificarDados();
