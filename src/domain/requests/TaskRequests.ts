export interface CreateTaskInput {
  guildId: string;
  createdBy: string;
  name: string;
  description?: string;
  parentId?: string | null;
  assigneeId?: string | null;
}
