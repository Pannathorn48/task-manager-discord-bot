import { ChatInputCommandInteraction, AutocompleteInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Handler } from "../Handler";
import { TaskService } from "@/domain/services/TaskService";
import { EditTaskInput } from "@/domain/requests/TaskRequests";
import { TaskError } from "@/domain/exceptions/TaskError";
import { TaskStatus } from "@/domain/models/Task";

export class EditTaskEventHandler extends Handler {
    private taskService: TaskService;
    
    constructor(taskService: TaskService) {
        super();
        this.taskService = taskService;
    }

    public getSlashCommand(): any {
        return new SlashCommandBuilder()
            .setName('task-edit')
            .setDescription('Edit an existing task')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('The ID of the task to edit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The new name of the task')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The new description of the task')
                    .setRequired(false))
            .addUserOption(option =>
                option.setName('assignee')
                    .setDescription('The user to assign this task to')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('parent-id')
                    .setDescription('The ID of the parent task (if this is a subtask)')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('status')
                    .setDescription('The status of the task')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Created', value: 'created' },
                        { name: 'Doing', value: 'doing' },
                        { name: 'Done', value: 'done' },
                        { name: 'Closed', value: 'closed' }
                    ));
    }

    public async handleInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<void> {
        if (interaction.isAutocomplete()) {
            // This command doesn't have autocomplete, so respond with empty array
            await interaction.respond([]);
            return;
        }
        
        const chatInteraction = interaction as ChatInputCommandInteraction;
        if (chatInteraction.commandName === 'task-edit') {
            await this.handleEditTask(chatInteraction);
        }
    }

    public async handleEditTask(interaction: ChatInputCommandInteraction): Promise<void> {
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

            const taskId = interaction.options.getString('id', true);
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');
            const assignee = interaction.options.getUser('assignee');
            const parentId = interaction.options.getString('parent-id');
            const status = interaction.options.getString('status') as TaskStatus | null;

            // Check if at least one field is provided for editing
            if (!name && !description && !assignee && !parentId && !status) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF6B6B)
                    .setTitle('⚠️ No Changes Specified')
                    .setDescription('Please specify at least one field to edit (name, description, assignee, parent-id, or status).')
                    .setTimestamp();

                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
                return;
            }

            const editTaskInput: EditTaskInput = {
                id: taskId,
                ...(name && { name }),
                ...(description !== null && { description }),
                ...(assignee !== null && { assigneeId: assignee?.id ?? null }),
                ...(parentId !== null && { parentId: parentId ?? null }),
                ...(status && { status })
            };

            try {
                await this.taskService.editTask(editTaskInput);
            } catch (error) {
                console.error('Error editing task:', error);
                if (error instanceof TaskError) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setTitle('⚠️ Task Edit Failed')
                        .setDescription(error.message)
                        .setTimestamp()
                        .setFooter({ text: 'Please check your input and try again' });

                    await interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setTitle('❌ Unexpected Error')
                        .setDescription('An unexpected error occurred while editing the task.')
                        .setTimestamp()
                        .setFooter({ text: 'Please try again later' });

                    await interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                }
                return;
            }

            const successEmbed = new EmbedBuilder()
                .setColor(0x4CAF50)
                .setTitle('✅ Task Updated Successfully!')
                .setDescription(`Task \`${taskId}\` has been updated!`)
                .setTimestamp()
                .setFooter({ text: `Updated by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

            // Add fields for what was changed
            const changedFields: string[] = [];
            if (name) changedFields.push(`**Name:** ${name}`);
            if (description !== null) changedFields.push(`**Description:** ${description || '*Removed*'}`);
            if (assignee !== null) {
                changedFields.push(`**Assignee:** ${assignee ? `<@${assignee.id}>` : '*Unassigned*'}`);
            }
            if (parentId !== null) {
                changedFields.push(`**Parent Task:** ${parentId || '*Removed*'}`);
            }
            if (status) changedFields.push(`**Status:** ${status.charAt(0).toUpperCase() + status.slice(1)}`);

            if (changedFields.length > 0) {
                successEmbed.addFields({ 
                    name: '📝 Changes Made', 
                    value: changedFields.join('\n'), 
                    inline: false 
                });
            }

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: false
            });

        } catch (error) {
            console.error('Error editing task:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('💥 Something Went Wrong')
                .setDescription('An error occurred while editing the task. Please try again.')
                .setTimestamp()
                .setFooter({ text: 'If this persists, contact an administrator' });

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
}