import { TaskRepository } from "@/domain/repositories/TaskRepository";
import { CreateTaskInput, EditTaskInput } from "@/domain/requests/TaskRequests";
import { TaskError } from "../exceptions/TaskError";
import { AssignedTaskResponse } from "../responses/TaskResponse";
import { Task } from "../models/Task";
import { ProgressionService } from "./ProgressionService";

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

    public async getUnassignedTasks() : Promise<AssignedTaskResponse[]> {
        return this.taskRepository.getUnassignedTasks();
    }

    public async getTasksByGuildId(guildId: string): Promise<Task[]> {
        return this.taskRepository.getTasksByGuildId(guildId);
    }

    public async acceptTask(taskId: string, userId: string): Promise<void> {
        const task = await this.taskRepository.getTaskByID(taskId);
        if (!task) {
            throw new TaskError(`Task with ID ${taskId} not found`);
        }

        if (task.assigneeId) {
            throw new TaskError(`Task with ID ${taskId} is already assigned`);
        }

        await this.taskRepository.acceptTask(taskId, userId);
    }

    public async getAssignedTasks(userId : string) : Promise<AssignedTaskResponse[]> {
        return this.taskRepository.getAssignedTasks(userId);
    }

    public async doneTask(taskId: string, userId: string): Promise<void> {
        const task = await this.taskRepository.getTaskByID(taskId);
        if (!task) {
            throw new TaskError(`Task with ID ${taskId} not found`);
        }
        if (task.assigneeId !== userId) {
            throw new TaskError(`You are not the assignee of task with ID ${taskId}`);
        }

        // Get all tasks in the same guild to check for children
        const allTasks = await this.taskRepository.getTasksByGuildId(task.guildId);
        
        // Get all task IDs that should be marked as done (including the main task and its children)
        const taskIdsToMarkAsDone = ProgressionService.markTaskAndChildrenAsDone(taskId, allTasks);
        
        if (taskIdsToMarkAsDone.length > 0) {
            // Mark all tasks as done in batch
            await this.taskRepository.markTasksAsDone(taskIdsToMarkAsDone);
        }
    }

    public async editTask(input: EditTaskInput): Promise<void> {
        const task = await this.taskRepository.getTaskByID(input.id);
        if (!task) {
            throw new TaskError(`Task with ID ${input.id} not found`);
        }

        if (input.parentId) {
            const parentTask = await this.taskRepository.getTaskByID(input.parentId);
            if (!parentTask) {
                throw new TaskError("Parent task not found");
            }
            if (parentTask.id === task.id) {
                throw new TaskError("A task cannot be its own parent");
            }
        }

        await this.taskRepository.editTask(input);
    }


}