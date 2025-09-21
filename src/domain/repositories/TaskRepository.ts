import { Task } from "@/domain/models/Task";
import { CreateTaskInput } from "@/domain/requests/TaskRequests";

export interface TaskRepository {
  getTaskByID(id: string): Promise<Task | null>;
  storeTask(taskCreate: CreateTaskInput): Promise<void>;
}
