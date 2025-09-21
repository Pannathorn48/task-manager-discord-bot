import { TaskService } from "@/domain/services/TaskService";
import { ProgressionService } from "@/domain/services/ProgressionService";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AutocompleteInteraction } from "discord.js";
import { Handler } from "../Handler";
import { TaskError } from "@/domain/exceptions/TaskError";
import { Task } from "@/domain/models/Task";

export class ProgressionEventHandler extends Handler {
    private taskService: TaskService;
    
    constructor(taskService: TaskService) {
        super();
        this.taskService = taskService;
    }

    public getSlashCommand(): any {
        return new SlashCommandBuilder()
            .setName('progress')
            .setDescription('Show task progression with visual tree and progress bars');
    }

    public async handleInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        
        const chatInteraction = interaction as ChatInputCommandInteraction;
        if (chatInteraction.commandName === 'progress') {
            await this.handleProgressionDisplay(chatInteraction);
        }
    }

    public async handleProgressionDisplay(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            if (!interaction.guildId) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF6B6B)
                    .setTitle('❌ Server Only Command')
                    .setDescription('This command can only be used in a server!')
                    .setTimestamp();

                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
                return;
            }

            // Get all tasks for this guild
            const tasks = await this.taskService.getTasksByGuildId(interaction.guildId);

            if (tasks.length === 0) {
                const noTasksEmbed = new EmbedBuilder()
                    .setColor(0xFFEB3B)
                    .setTitle('📋 No Tasks Found')
                    .setDescription('No tasks have been created in this server yet. Use `/task-create` to create your first task!')
                    .setTimestamp();

                await interaction.reply({
                    embeds: [noTasksEmbed],
                    ephemeral: true
                });
                return;
            }

            // Build task hierarchy with progress
            const hierarchy = ProgressionService.buildTaskHierarchy(tasks);

            if (hierarchy.length === 0) {
                const noRootTasksEmbed = new EmbedBuilder()
                    .setColor(0xFFEB3B)
                    .setTitle('📋 No Root Tasks Found')
                    .setDescription('All tasks appear to be subtasks. There are no root tasks to display.')
                    .setTimestamp();

                await interaction.reply({
                    embeds: [noRootTasksEmbed],
                    ephemeral: true
                });
                return;
            }

            // Format the progression display
            const progressionText = ProgressionService.formatProgressionDisplay(hierarchy);

            // Discord has a limit of 4096 characters for embed descriptions
            // If the text is too long, we'll need to truncate or split it
            const maxLength = 4000; // Leave some buffer
            let displayText = progressionText;
            
            if (progressionText.length > maxLength) {
                displayText = progressionText.substring(0, maxLength - 50) + '\n\n... (truncated)';
            }

            const progressEmbed = new EmbedBuilder()
                .setColor(0x4CAF50)
                .setTitle('📊 Task Progression')
                .setDescription(`\`\`\`\n${displayText}\`\`\``)
                .setFooter({ 
                    text: `Total tasks: ${tasks.length} | Created: ${tasks.filter((t: Task) => t.status === 'created').length} | In Progress: ${tasks.filter((t: Task) => t.status === 'doing').length} | Done: ${tasks.filter((t: Task) => t.status === 'done').length} | Closed: ${tasks.filter((t: Task) => t.status === 'closed').length}` 
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [progressEmbed]
            });

        } catch (error) {
            console.error('Error in progression display:', error);
            
            let errorMessage = 'An unexpected error occurred while displaying progression.';
            if (error instanceof TaskError) {
                errorMessage = error.message;
            }

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('❌ Error')
                .setDescription(errorMessage)
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
            }
        }
    }
}