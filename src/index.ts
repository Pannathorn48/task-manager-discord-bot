import { Config } from "@/configs/config";
import { Database } from "@/configs/database";
import { startBot } from "@/configs/bot";
import { MainHandler } from "./infrastructure/handlers/MainHandler";

async function main() {
    try {
        var cfg : Config = Config.getInstance();
        var db : Database = await Database.initializeDatabase(cfg);

        var handler : MainHandler = new MainHandler(cfg , db);
        
        await startBot(handler);
        console.log('Discord bot started successfully!');
    } catch (error) {
        console.error('Failed to start the application:', error);
        process.exit(1);
    }
}

main();
