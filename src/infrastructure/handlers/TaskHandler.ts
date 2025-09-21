import { TaskService } from "@/domain/services/TaskService";
import { CreateTaskInput } from "@/domain/requests/TaskRequests";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Handler } from "./Handler";
import { TaskError } from "@/domain/exceptions/TaskError";

export class TaskHandler extends Handler {
    private taskService: TaskService;
    
    constructor(taskService: TaskService) {
        super();
        this.taskService = taskService;
    }

    public getSlashCommand() {
        return new SlashCommandBuilder()
            .setName('task-create')
            .setDescription('Create a new task')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name of the task')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The description of the task')
                    .setRequired(false))
            .addUserOption(option =>
                option.setName('assignee')
                    .setDescription('The user to assign this task to')
                    .setRequired(false))
            .addStringOption(option =>
                option.setName('parent-id')
                    .setDescription('The ID of the parent task (if this is a subtask)')
                    .setRequired(false));
    }

    public async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.commandName === 'task-create') {
            await this.handleCreateTask(interaction);
        }
    }

    public async handleCreateTask(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            if (!interaction.guildId) {
                await interaction.reply({
                    content: 'This command can only be used in a server!',
                    ephemeral: true
                });
                return;
            }

            const name = interaction.options.getString('name', true);
            const description = interaction.options.getString('description');
            const assignee = interaction.options.getUser('assignee');
            const parentId = interaction.options.getString('parent-id');

            const createTaskInput: CreateTaskInput = {
                guildId: interaction.guildId,
                createdBy: interaction.user.id,
                name: name,
                ...(description && { description }),
                assigneeId: assignee?.id ?? null,
                parentId: parentId ?? null
            };

            try {
                await this.taskService.createTask(createTaskInput);
            } catch (error) {
                console.error('Error creating task:', error);
                if (error instanceof TaskError) {
                    await interaction.reply({
                        content: error.message,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: 'An unexpected error occurred.',
                        ephemeral: true
                    });
                }
                return;
            }

            let responseMessage = `✅ Task "${name}" has been created successfully!`;
            
            if (assignee) {
                responseMessage += `\n👤 Assigned to: ${assignee.displayName}`;
            }
            
            if (description) {
                responseMessage += `\n📝 Description: ${description}`;
            }
            
            if (parentId) {
                responseMessage += `\n🔗 Parent Task ID: ${parentId}`;
            }

            await interaction.reply({
                content: responseMessage,
                ephemeral: false
            });

        } catch (error) {
            console.error('Error creating task:', error);
            await interaction.reply({
                content: 'An error occurred while creating the task. Please try again.',
                ephemeral: true
            });
        }
    }
}