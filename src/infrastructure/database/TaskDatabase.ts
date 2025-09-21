import { Database } from "@/configs/database";
import { Task } from "@/domain/models/Task";
import { TaskRepository } from "@/domain/repositories/TaskRepository";
import { CreateTaskInput } from "@/domain/requests/TaskRequests";

export class TaskDatabase implements TaskRepository {
    private db : Database | null = null;
    public static instance: TaskDatabase | null = null;
    private constructor(db : Database) {
        this.db = db;
    }

    public static getInstance(db : Database) : TaskDatabase {
        if (TaskDatabase.instance === null) {
            TaskDatabase.instance = new TaskDatabase(db);
        }
        return TaskDatabase.instance;
    }
    async getTaskByID(id : string): Promise<Task | null> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        const query = `SELECT (id, guild_id, created_by, name, description, parent_id, assignee_id) FROM tasks WHERE id = $1`;
        const result = await this.db.query(query, [id]);
        if (result && result.rows && result.rows.length > 0) {
            const row = result.rows[0];
            return {
                id: row.id,
                guildId: row.guild_id,
                createdBy: row.created_by,
                name: row.name,
                description: row.description,
                parentId: row.parent_id,
                assigneeId: row.assignee_id
            } as Task;
        }
        return null;
    }
    async storeTask(task: CreateTaskInput): Promise<void> {
        let query = `INSERT INTO tasks (guild_id, created_by, name, description, parent_id, assignee_id) 
        VALUES ($1, $2, $3, $4, $5, $6)`;
        let values = [
            task.guildId,
            task.createdBy,
            task.name,
            task.description || null,
            task.parentId || null,
            task.assigneeId || null
        ];
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        await this.db.query(query, values);
    }

}