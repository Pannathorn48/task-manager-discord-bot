import { Task } from "@/domain/models/Task";
import { CreateTaskInput, EditTaskInput } from "@/domain/requests/TaskRequests";
import { AssignedTaskResponse } from "../responses/TaskResponse";

export interface TaskRepository {
  getTaskByID(id: string): Promise<Task | null>;
  getTasks() : Promise<Task[]>;
  getTasksByGuildId(guildId: string): Promise<Task[]>;
  getUnassignedTasks(): Promise<AssignedTaskResponse[]>; 
  getAssignedTasks(userId : string): Promise<AssignedTaskResponse[]>;

  storeTask(taskCreate: CreateTaskInput): Promise<void>;
  editTask(taskEdit : EditTaskInput) : Promise<void>;

  acceptTask(taskId: string, userId: string): Promise<void>;
  doneTask(taskId: string, userId: string): Promise<void>;
  markTasksAsDone(taskIds: string[]): Promise<void>;
}
