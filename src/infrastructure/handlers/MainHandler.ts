import { Config } from "@/configs/config";
import { Database } from "@/configs/database";
import { TaskHandler } from "@/infrastructure/handlers/TaskHandler";
import { TaskDatabase } from "../database/TaskDatabase";
import { TaskService } from "@/domain/services/TaskService";
import { Handler } from "./Handler";

export  class MainHandler {
    public handlers : Map<string, Handler> = new Map();
    constructor(cfg : Config ,db : Database) {
       let taskRepo =  TaskDatabase.getInstance(db);
       let taskService = TaskService.getInstance(taskRepo);
       let taskHandler = new TaskHandler(taskService);

       this.handlers.set(taskHandler.getSlashCommand().name , taskHandler);

    }
}