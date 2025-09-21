import { TaskService } from "@/domain/services/TaskService";
import { CreateTaskInput } from "@/domain/requests/TaskRequests";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AutocompleteInteraction } from "discord.js";
import { Handler } from "../Handler";
import { TaskError } from "@/domain/exceptions/TaskError";

export class CreateTaskEventHandler extends Handler {
    private taskService: TaskService;
    
    constructor(taskService: TaskService) {
        super();
        this.taskService = taskService;
    }

    public getSlashCommand() : any {
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

    public async handleInteraction(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Promise<void> {
        if (interaction.isAutocomplete()) {
            // This command doesn't have autocomplete, so respond with empty array
            await interaction.respond([]);
            return;
        }
        
        const chatInteraction = interaction as ChatInputCommandInteraction;
        if (chatInteraction.commandName === 'task-create') {
            await this.handleCreateTask(chatInteraction);
        }
    }

    public async handleCreateTask(interaction: ChatInputCommandInteraction): Promise<void> {
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
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF6B6B)
                        .setTitle('⚠️ Task Creation Failed')
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
                        .setDescription('An unexpected error occurred while creating the task.')
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
                .setTitle('✅ Task Created Successfully!')
                .setDescription(`**${name}** has been created and is ready to go!`)
                .setTimestamp()
                .setFooter({ text: `Created by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

            if (description) {
                successEmbed.addFields({ name: '� Description', value: description, inline: false });
            }

            if (assignee) {
                successEmbed.addFields({ 
                    name: '👤 Assigned To', 
                    value: `<@${assignee.id}>`, 
                    inline: true 
                });
            }

            if (parentId) {
                successEmbed.addFields({ 
                    name: '🔗 Parent Task', 
                    value: `ID: \`${parentId}\``, 
                    inline: true 
                });
            }

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: false
            });

        } catch (error) {
            console.error('Error creating task:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('💥 Something Went Wrong')
                .setDescription('An error occurred while creating the task. Please try again.')
                .setTimestamp()
                .setFooter({ text: 'If this persists, contact an administrator' });

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
}