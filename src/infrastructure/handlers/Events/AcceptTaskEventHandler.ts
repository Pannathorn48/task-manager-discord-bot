import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction, SlashCommandOptionsOnlyBuilder, EmbedBuilder } from "discord.js";
import { Handler } from "../Handler";
import { TaskService } from "@/domain/services/TaskService";

export class AcceptTaskEventHandler implements Handler {
    private taskService: TaskService;
    constructor(taskService: TaskService) {
        this.taskService = taskService;
    }

    async handleInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<void> {
        try {
            if (interaction.isAutocomplete()) {
                await this.handleAutocomplete(interaction);
            } else {
                const chatInteraction = interaction as ChatInputCommandInteraction;
                const taskId = chatInteraction.options.getString('task-id', true);
                const user = chatInteraction.user;

                const task = await this.taskService.acceptTask(taskId, user.id);
                
                const successEmbed = new EmbedBuilder()
                    .setColor('#007bff') // Blue color for acceptance
                    .setTitle('🎯 Task Accepted!')
                    .setDescription(`You've successfully accepted this task. Time to get started!`)
                    .addFields(
                        { name: '📋 Task ID', value: `\`${taskId}\``, inline: true },
                        { name: '👤 Assigned to', value: `<@${user.id}>`, inline: true },
                        { name: '📅 Accepted at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setFooter({ text: 'Good luck with your task!' })
                    .setTimestamp();

                await chatInteraction.reply({
                    embeds: [successEmbed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in AcceptTaskEventHandler:', error);
            if (interaction.isAutocomplete()) {
                try {
                    await interaction.respond([]);
                } catch (respondError) {
                    console.error('Failed to respond to autocomplete with empty array:', respondError);
                }
            } else if (!interaction.replied && !interaction.deferred) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#dc3545') // Red color for error
                    .setTitle('❌ Error Accepting Task')
                    .setDescription('Something went wrong while trying to accept the task.')
                    .addFields(
                        { name: '🔍 Error Details', value: error instanceof Error ? error.message : 'Unknown error occurred', inline: false }
                    )
                    .setFooter({ text: 'Please try again or contact support if the issue persists.' })
                    .setTimestamp();

                await (interaction as ChatInputCommandInteraction).reply({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
            }
        }
    }

    private async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        try {
            const focusedOption = interaction.options.getFocused(true);
            console.log("Autocomplete triggered for:", focusedOption.name, "with value:", focusedOption.value);
            
            if (focusedOption.name === 'task-id') {
                console.log("Fetching unassigned tasks for autocomplete...");
                const unassignedTasks = await this.taskService.getUnassignedTasks();
                console.log("Retrieved unassigned tasks:", unassignedTasks);
                
                const choices = unassignedTasks.map(task => ({
                    name: `${task.id}: ${task.name}`,
                    value: task.id.toString()
                }));
                console.log("Autocomplete choices:", choices);
                
                await interaction.respond(choices.slice(0, 25)); 
                console.log("Autocomplete response sent");
            }
        } catch (error) {
            console.error('Error in handleAutocomplete:', error);
            try {
                await interaction.respond([]);
            } catch (respondError) {
                console.error('Failed to respond to autocomplete with empty array:', respondError);
            }
        }
    }
    getSlashCommand(): any {
        return new SlashCommandBuilder()
            .setName("accept")
            .setDescription("🎯 Accept a task and assign it to yourself")
            .addStringOption(option =>
                option.setName('task-id')
                    .setDescription('Select the task you want to accept')
                    .setAutocomplete(true)
                    .setRequired(true));
    }

}