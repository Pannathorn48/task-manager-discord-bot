import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction, SlashCommandOptionsOnlyBuilder, EmbedBuilder } from "discord.js";
import { Handler } from "../Handler";
import { TaskService } from "@/domain/services/TaskService";

export class DoneTaskEventHandler implements Handler {
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

                const task = await this.taskService.doneTask(taskId, user.id);
                
                const successEmbed = new EmbedBuilder()
                    .setColor('#28a745') // Green color for success
                    .setTitle('✅ Task Completed!')
                    .setDescription(`Great job! You've successfully completed this task.`)
                    .addFields(
                        { name: '📋 Task ID', value: `\`${taskId}\``, inline: true },
                        { name: '👤 Completed by', value: `<@${user.id}>`, inline: true },
                        { name: '⏰ Completed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setFooter({ text: 'Keep up the great work!' })
                    .setTimestamp();

                await chatInteraction.reply({
                    embeds: [successEmbed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in DoneTaskEventHandler:', error);
            if (interaction.isAutocomplete()) {
                try {
                    await interaction.respond([]);
                } catch (respondError) {
                    console.error('Failed to respond to autocomplete with empty array:', respondError);
                }
            } else if (!interaction.replied && !interaction.deferred) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#dc3545') // Red color for error
                    .setTitle('❌ Error Completing Task')
                    .setDescription('Something went wrong while trying to mark the task as done.')
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
                console.log("Fetching assigned tasks for autocomplete...");
                const assignedTasks = await this.taskService.getAssignedTasks(interaction.user.id);
                console.log("Retrieved assigned tasks:", assignedTasks);

                const choices = assignedTasks.map(task => ({
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
            .setName("done")
            .setDescription("✅ Mark a task as completed")
            .addStringOption(option =>
                option.setName('task-id')
                    .setDescription('Select the task you want to mark as done')
                    .setAutocomplete(true)
                    .setRequired(true));
    }

}