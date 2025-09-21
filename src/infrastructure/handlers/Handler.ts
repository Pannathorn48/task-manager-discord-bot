import { ChatInputCommandInteraction } from "discord.js";

export abstract class Handler {
    constructor() {}
    
    abstract handleInteraction(interaction: ChatInputCommandInteraction): Promise<void>;
    abstract getSlashCommand(): any;
}