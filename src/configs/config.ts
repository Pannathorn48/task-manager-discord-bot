import { ConfigError } from "@/domain/exceptions/ConfigError";
import dotenv from "dotenv";

export class Config {
  private static instance: Config | null = null;

  public PG_HOST: string;
  public PG_DATABASE: string;
  public PG_USER: string;
  public PG_PASSWORD: string;
  public PG_PORT: number;
  public ADMIN_EMAIL: string;
  public ADMIN_PASSWORD: string;

  private constructor() {
    dotenv.config();

    let host: string | undefined = process.env.PG_HOST;
    if (!host) {
      throw new ConfigError("PG_HOST is not defined");
    }
    let database: string | undefined = process.env.PG_DATABASE;
    if (!database) {
      throw new ConfigError("PG_DATABASE is not defined");
    }
    let user: string | undefined = process.env.PG_USER;
    if (!user) {
      throw new ConfigError("PG_USER is not defined");
    }
    let password: string | undefined = process.env.PG_PASSWORD;
    if (!password) {
      throw new ConfigError("PG_PASSWORD is not defined");
    }
    let port: number | undefined = process.env.PG_PORT ? parseInt(process.env.PG_PORT) : undefined;
    if (!port) {
      throw new ConfigError("PG_PORT is not defined or invalid");
    }

    let adminEmail: string | undefined = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new ConfigError("ADMIN_EMAIL is not defined");
    }
    let adminPassword: string | undefined = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new ConfigError("ADMIN_PASSWORD is not defined");
    }

      this.PG_HOST = host;
      this.PG_DATABASE = database;
      this.PG_USER = user;
      this.PG_PASSWORD = password;
      this.PG_PORT = port;
      this.ADMIN_EMAIL = adminEmail;
      this.ADMIN_PASSWORD = adminPassword;
  }
  public static getInstance(): Config {
    if (Config.instance === null) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}



