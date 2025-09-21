import { ChatInputCommandInteraction, AutocompleteInteraction} from "discord.js";

export abstract class Handler {
    constructor() {}
    
    abstract handleInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<void>;
    abstract getSlashCommand(): any;
}