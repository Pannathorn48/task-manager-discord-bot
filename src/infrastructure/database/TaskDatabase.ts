import { Database } from "@/configs/database";
import { Task } from "@/domain/models/Task";
import { TaskRepository } from "@/domain/repositories/TaskRepository";
import { CreateTaskInput, EditTaskInput } from "@/domain/requests/TaskRequests";
import { AssignedTaskResponse } from "@/domain/responses/TaskResponse";
import { DatabaseError } from "@/domain/exceptions/DatabaseError";

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
        const query = `SELECT id, guild_id, created_by, name, description, parent_id, assignee_id FROM tasks WHERE id = $1`;
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

    async assignTask(taskId: string, userId: string): Promise<void> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        const query = `UPDATE tasks SET assignee_id = $1 WHERE id = $2`;
        await this.db.query(query, [userId, taskId]);
    }
    
    async getUnassignedTasks(): Promise<AssignedTaskResponse[]> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        console.log("Fetching unassigned tasks from database...");
        const query = `SELECT id, name, description FROM tasks WHERE assignee_id IS NULL AND parent_id IS NULL`;
        const result = await this.db.query(query);
        const tasks: AssignedTaskResponse[] = [];
        if (result && result.rows) {
            for (const row of result.rows) {
                tasks.push({
                    id: row.id,
                    name: row.name,
                    description: row.description
                });
            }
        }
        console.log("Unassigned tasks fetched:", tasks);
        return tasks;
    }

    async acceptTask(taskId: string , userId: string): Promise<void> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        let query = `UPDATE tasks SET status = 'doing', assignee_id = $1 WHERE id = $2`;
        await this.db.query(query, [userId, taskId]);
    }

    async doneTask(taskId: string , userId : string): Promise<void> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        let query = `UPDATE tasks SET status = 'done' WHERE id = $1 AND assignee_id = $2`;
        await this.db.query(query, [taskId, userId]);
    }

    async markTasksAsDone(taskIds: string[]): Promise<void> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        
        if (taskIds.length === 0) {
            return;
        }
        
        // Create placeholders for the IN clause
        const placeholders = taskIds.map((_, index) => `$${index + 1}`).join(', ');
        const query = `UPDATE tasks SET status = 'done' WHERE id IN (${placeholders})`;
        
        await this.db.query(query, taskIds);
    }

    async getAssignedTasks(userId : string): Promise<AssignedTaskResponse[]> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        const query = `SELECT id, name, description FROM tasks WHERE assignee_id = $1 AND status = 'doing'`;
        const result = await this.db.query(query, [userId]);
        const tasks: AssignedTaskResponse[] = [];
        if (result && result.rows) {
            for (const row of result.rows) {
                tasks.push({
                    id: row.id,
                    name: row.name,
                    description: row.description
                });
            }
        }
        return tasks;
    }

    async getTasks(): Promise<Task[]> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        let query : string = `
        SELECT 
            id, guild_id, created_by, name, description, parent_id, assignee_id , status , created_at
        FROM tasks
        `;
        const result = await this.db.query(query);
        const tasks: Task[] = [];
        if (result && result.rows) {
            for (const row of result.rows) {
                tasks.push({
                    id: row.id,
                    guildId: row.guild_id,
                    createdBy: row.created_by,
                    name: row.name,
                    description: row.description,
                    parentId: row.parent_id,
                    assigneeId: row.assignee_id,
                    status: row.status,
                    createdAt: row.created_at
                });
            }
        }
        return tasks;
    }

    async getTasksByGuildId(guildId: string): Promise<Task[]> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }
        let query : string = `
        SELECT 
            id, guild_id, created_by, name, description, parent_id, assignee_id , status , created_at
        FROM tasks
        WHERE guild_id = $1
        ORDER BY created_at ASC
        `;
        const result = await this.db.query(query, [guildId]);
        const tasks: Task[] = [];
        if (result && result.rows) {
            for (const row of result.rows) {
                tasks.push({
                    id: row.id,
                    guildId: row.guild_id,
                    createdBy: row.created_by,
                    name: row.name,
                    description: row.description,
                    parentId: row.parent_id,
                    assigneeId: row.assignee_id,
                    status: row.status,
                    createdAt: row.created_at
                });
            }
        }
        return tasks;
    }

    async editTask(task: EditTaskInput): Promise<void> {
        if (!this.db) {
            throw new DatabaseError("Database not initialized");
        }

        // Build dynamic query based on provided fields
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (task.name !== undefined && task.name !== null) {
            fields.push(`name = $${idx++}`);
            values.push(task.name);
        }
        if (task.description !== undefined && task.description !== null) {
            fields.push(`description = $${idx++}`);
            values.push(task.description);
        }
        if (task.parentId !== undefined && task.parentId !== null) {
            fields.push(`parent_id = $${idx++}`);
            values.push(task.parentId);
        }
        if (task.assigneeId !== undefined && task.assigneeId !== null) {
            fields.push(`assignee_id = $${idx++}`);
            values.push(task.assigneeId);
        }
        if (task.status !== undefined && task.status !== null) {
            fields.push(`status = $${idx++}`);
            values.push(task.status);
        }

        if (fields.length === 0) {
            // Nothing to update
            return;
        }

        // Add id for WHERE clause
        values.push(task.id);

        const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}`;
        await this.db.query(query, values);
    }
}
