import { Config } from "@/configs/config";
import { Database } from "@/configs/database";
import { CreateTaskEventHandler } from "@/infrastructure/handlers/Events/CreateTaskEventHandler";
import { TaskDatabase } from "../database/TaskDatabase";
import { TaskService } from "@/domain/services/TaskService";
import { Handler } from "./Handler";
import { AcceptTaskEventHandler } from "./Events/AcceptTaskEventHandler";
import { DoneTaskEventHandler } from "./Events/DoneTaskEventHandler";
import { ProgressionEventHandler } from "./Events/ProgressionEventHandler";
import { EditTaskEventHandler } from "./Events/EditTaskEventHandler";

export  class MainHandler {
    public handlers : Map<string, Handler> = new Map();
    constructor(db : Database) {
       let taskRepo =  TaskDatabase.getInstance(db);
       let taskService = TaskService.getInstance(taskRepo);

       let createEventHandler = new CreateTaskEventHandler(taskService);
       let acceptEventHandler = new AcceptTaskEventHandler(taskService);
       let doneEventHandler = new DoneTaskEventHandler(taskService);
       let progressionEventHandler = new ProgressionEventHandler(taskService);
       let editTaskEventHandler = new EditTaskEventHandler(taskService); 

       this.handlers.set(createEventHandler.getSlashCommand().name , createEventHandler);
       this.handlers.set(acceptEventHandler.getSlashCommand().name , acceptEventHandler);
       this.handlers.set(doneEventHandler.getSlashCommand().name , doneEventHandler);
       this.handlers.set(progressionEventHandler.getSlashCommand().name , progressionEventHandler);
       this.handlers.set(editTaskEventHandler.getSlashCommand().name , editTaskEventHandler);
    }
}