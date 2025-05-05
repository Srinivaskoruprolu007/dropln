import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {migrate} from "drizzle-orm/neon-http/migrator";

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

async function runMigrations(){
    try {
        const sql = neon(process.env.DATABASE_URL!);
        const db = drizzle(sql);    
        await migrate(db, {migrationsFolder:"drizzle"})
        console.log("Migrations complete");
    } catch (error) {
        console.log("Migrations not completed succesfully");
        console.log(error);
        process.exit(1);
    }
}
runMigrations()