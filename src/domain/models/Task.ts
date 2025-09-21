export type TaskStatus = "created" | "doing" | "done" | "closed";

export interface Task {
  id: string; // numeric string unique per guild
  guildId: string;
  name: string;
  description?: string; // optional description
  status: TaskStatus;
  parentId?: string | null;
  assigneeId?: string; // Discord user id
  createdBy: string; // Discord user id
  createdAt: number; // epoch ms
}
