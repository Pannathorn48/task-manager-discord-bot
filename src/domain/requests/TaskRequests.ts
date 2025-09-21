import { TaskStatus } from "../models/Task";

export interface CreateTaskInput {
  guildId: string;
  createdBy: string;
  name: string;
  description?: string;
  parentId?: string | null;
  assigneeId?: string | null;
}

export interface EditTaskInput {
  id: string;
  name?: string;
  description?: string;
  parentId?: string | null;
  assigneeId?: string | null;
  status? : TaskStatus
}
