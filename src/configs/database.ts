import { Pool, PoolClient, Result } from "pg";
import { createTasksTable } from "@/infrastructure/migrations/migrations.js";
import { Config } from "@/configs/config";

export class Database {
  private static instance: Database | null = null;
  private pool: Pool;

  private constructor(config: Config) {
    this.pool = new Pool({
      host: config.PG_HOST,
      database: config.PG_DATABASE,
      user: config.PG_USER,
      password: config.PG_PASSWORD,
      port: config.PG_PORT ,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on("error", (err: Error) => {
      console.error("Unexpected error on idle client:", err);
    });
  }

  public static getInstance(config: Config): Database {
    if (Database.instance === null) {
      Database.instance = new Database(config);
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log("Connected to PostgreSQL database");
      client.release();
    } catch (error) {
      console.error(
        "Failed to connect to database. Please check your database configuration and ensure PostgreSQL is running.",
      );
      // Don't log the full error which might contain sensitive connection details
      if (error instanceof Error) {
        console.error("Connection error type:", error.constructor.name);
      }
      throw new Error("Database connection failed");
    }
  }

  async migrate(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(createTasksTable);
      console.log("Database migration completed successfully");
    } catch (error) {
      console.error(
        "Database migration failed. Please check your database permissions and schema.",
      );
      if (error instanceof Error) {
        console.error("Migration error type:", error.constructor.name);
        // Only log error message, not potentially sensitive details
        console.error("Error message:", error.message);
      }
      throw new Error("Database migration failed");
    } finally {
      client.release();
    }
  }

  async query(text: string, params?: any[]): Promise<Result> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log("Database connection pool closed");
  }

  public static async initializeDatabase(cfg : Config): Promise<Database> {
  const database = Database.getInstance(cfg);
  await database.connect();
  await database.migrate();
  return database;
}
}


