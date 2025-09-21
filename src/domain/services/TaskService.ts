import { TaskRepository } from "@/domain/repositories/TaskRepository";
import { CreateTaskInput } from "@/domain/requests/TaskRequests";
import { TaskError } from "../exceptions/TaskError";

export class TaskService {
    private taskRepository: TaskRepository;
    private static instance: TaskService | null = null;
    private constructor(taskRepository: TaskRepository) {
        this.taskRepository = taskRepository;
    }

    public static getInstance(taskRepository: TaskRepository): TaskService {
        if (TaskService.instance === null) {
            TaskService.instance = new TaskService(taskRepository);
        }
        return TaskService.instance;
    }
    
    public async createTask(input: CreateTaskInput): Promise<void> {
        if (input.parentId) {
            const parentTask = await this.taskRepository.getTaskByID(input.parentId);
            console.log(`Parent task fetched: ${parentTask}`);
            console.log(parentTask);
            if (!parentTask) {
                console.log("Parent task is null or undefined");
                throw new TaskError("Parent task not found");
            }
        }

        await this.taskRepository.storeTask(input);
    }



}