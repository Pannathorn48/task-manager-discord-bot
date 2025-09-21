import { Task, TaskStatus } from "@/domain/models/Task";

export interface TaskWithProgress {
    task: Task;
    progress: number; // 0-100
    children: TaskWithProgress[];
}

export class ProgressionService {
    /**
     * Build task hierarchy with calculated progress
     */
    public static buildTaskHierarchy(tasks: Task[]): TaskWithProgress[] {
        // Create a map for quick lookup
        const taskMap = new Map<string, Task>();
        tasks.forEach(task => taskMap.set(task.id, task));

        // Find root tasks (no parent)
        const rootTasks = tasks.filter(task => !task.parentId);
        
        // Build hierarchy recursively
        return rootTasks.map(rootTask => this.buildTaskWithProgress(rootTask, taskMap));
    }

    /**
     * Build a single task with its children and calculated progress
     */
    private static buildTaskWithProgress(task: Task, taskMap: Map<string, Task>): TaskWithProgress {
        // Find children
        const children = Array.from(taskMap.values())
            .filter(t => t.parentId === task.id)
            .map(childTask => this.buildTaskWithProgress(childTask, taskMap));

        // Calculate progress
        const progress = this.calculateProgress(task, children);

        return {
            task,
            progress,
            children
        };
    }

    /**
     * Calculate progress for a task based on its status and children
     */
    private static calculateProgress(task: Task, children: TaskWithProgress[]): number {
        // If the task itself is marked as done, it should show 100% regardless of children
        if (task.status === "done") {
            return 100;
        }
        
        // If task has no children, progress is based on its status
        if (children.length === 0) {
            return this.getTaskStatusProgress(task.status);
        }

        // If task has children, progress is average of children's progress
        const totalProgress = children.reduce((sum, child) => sum + child.progress, 0);
        return Math.round(totalProgress / children.length);
    }

    /**
     * Get progress percentage based on task status
     */
    private static getTaskStatusProgress(status: TaskStatus): number {
        switch (status) {
            case "created":
                return 0;
            case "doing":
                return 0; // Tasks in progress show 0%
            case "done":
                return 100;
            case "closed":
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Format task hierarchy into a beautiful progress-focused display with clear hierarchy
     */
    public static formatProgressionDisplay(hierarchy: TaskWithProgress[]): string {
        if (hierarchy.length === 0) {
            return "🎯 **No tasks found** - Start by creating your first task!";
        }

        let result = "";
        
        // Beautiful header with overall progress
        result += "╔═══════════════════════════════════╗\n";
        result += "║           🎯 TASK PROGRESS         ║\n";
        result += "╚═══════════════════════════════════╝\n\n";
        
        // Calculate overall progress
        const totalProgress = hierarchy.length > 0 
            ? Math.round(hierarchy.reduce((sum, task) => sum + task.progress, 0) / hierarchy.length)
            : 0;
        
        // Overall progress bar with larger size
        const overallBar = this.createProgressBar(totalProgress, 20);
        result += `📊 **OVERALL:** ${overallBar} **${totalProgress}%**\n\n`;
        
        // Add separator
        result += "─".repeat(40) + "\n\n";
        
        for (let i = 0; i < hierarchy.length; i++) {
            const taskWithProgress = hierarchy[i];
            if (taskWithProgress) {
                const isLast = i === hierarchy.length - 1;
                result += this.formatTaskNode(taskWithProgress, "", isLast, 0);
                if (i < hierarchy.length - 1) {
                    result += "\n";
                }
            }
        }
        
        return result;
    }

    /**
     * Format a single task node with progress bar and beautiful hierarchy
     */
    private static formatTaskNode(taskWithProgress: TaskWithProgress, prefix: string, isLast: boolean, level: number = 0): string {
        const { task, progress, children } = taskWithProgress;
        
        // Status emoji
        const statusEmoji = this.getStatusEmoji(task.status);
        
        // Beautiful tree connectors based on level
        let connector = "";
        let continuePrefix = "";
        
        if (level === 0) {
            connector = isLast ? "└─" : "├─";
            continuePrefix = isLast ? "   " : "│  ";
        } else {
            connector = isLast ? "└─" : "├─";
            continuePrefix = isLast ? "   " : "│  ";
        }
        
        // Progress bar with different sizes based on level
        const barLength = Math.max(12 - level * 2, 6); // Smaller bars for deeper levels
        const progressBar = this.createProgressBar(progress, barLength);
        
        // Task header with beautiful formatting
        let result = `${prefix}${connector} ${statusEmoji} **${task.name}** \`#${task.id}\`\n`;
        result += `${prefix}${continuePrefix}${progressBar} **${progress}%**\n`;
        
        if (task.description) {
            result += `${prefix}${continuePrefix}*${task.description}*`;
            if (task.status === "closed") {
                result += " `[CLOSED]`";
            }
            result += "\n";
        }
        
        // Add spacing between parent and children if there are children
        if (children.length > 0) {
            result += `${prefix}${continuePrefix}\n`;
        }
        
        // Children with proper hierarchy
        for (let i = 0; i < children.length; i++) {
            const isLastChild = i === children.length - 1;
            const childPrefix = prefix + continuePrefix;
            const child = children[i];
            if (child) {
                result += this.formatTaskNode(child, childPrefix, isLastChild, level + 1);
            }
        }
        
        return result;
    }

    /**
     * Get beautiful emoji based on task status
     */
    private static getStatusEmoji(status: TaskStatus): string {
        switch (status) {
            case "created":
                return "🆕"; // New/created task - bright blue "NEW" badge
            case "doing":
                return "⚡"; // In progress - lightning bolt for energy/activity
            case "done":
                return "🎉"; // Completed - celebration for accomplishment
            case "closed":
                return "�"; // Closed - archived/boxed up
            default:
                return "❓"; // Unknown
        }
    }

    /**
     * Create a beautiful progress bar with visual appeal
     */
    private static createProgressBar(progress: number, length: number = 10): string {
        const filledLength = Math.round((progress / 100) * length);
        const emptyLength = length - filledLength;
        
        // Use different characters based on progress level for visual appeal
        let fillChar = "█";
        let emptyChar = "░";
        
        // Add visual variety based on progress
        if (progress === 100) {
            fillChar = "█"; // Solid when complete
        } else if (progress >= 75) {
            fillChar = "█"; // Solid for high progress
        } else if (progress >= 50) {
            fillChar = "▓"; // Medium density for medium progress
        } else if (progress >= 25) {
            fillChar = "▒"; // Light density for low progress
        } else if (progress > 0) {
            fillChar = "░"; // Very light for very low progress
        }
        
        const filled = fillChar.repeat(filledLength);
        const empty = emptyChar.repeat(emptyLength);
        
        return `${filled}${empty}`;
    }

    /**
     * Get all child task IDs that should be marked as done when parent is marked as done
     */
    public static getChildrenToMarkAsDone(parentTaskId: string, allTasks: Task[]): string[] {
        return this.getAllDescendants(parentTaskId, allTasks)
            .filter(task => task.status !== "done" && task.status !== "closed")
            .map(task => task.id);
    }

    /**
     * Get all descendant tasks recursively (children, grandchildren, etc.)
     */
    private static getAllDescendants(parentTaskId: string, allTasks: Task[]): Task[] {
        const descendants: Task[] = [];
        
        // Find all direct children
        const directChildren = allTasks.filter(task => task.parentId === parentTaskId);
        
        for (const child of directChildren) {
            // Add the child
            descendants.push(child);
            
            // Recursively get all descendants of this child
            const childDescendants = this.getAllDescendants(child.id, allTasks);
            descendants.push(...childDescendants);
        }
        
        return descendants;
    }

    /**
     * Mark a task and all its children as done
     * Returns array of task IDs that were marked as done
     */
    public static markTaskAndChildrenAsDone(parentTaskId: string, allTasks: Task[]): string[] {
        const tasksToUpdate: string[] = [];
        
        // Add the parent task itself
        const parentTask = allTasks.find(task => task.id === parentTaskId);
        if (parentTask && parentTask.status !== "done" && parentTask.status !== "closed") {
            tasksToUpdate.push(parentTaskId);
        }
        
        // Get all children that should be marked as done
        const childrenToUpdate = this.getChildrenToMarkAsDone(parentTaskId, allTasks);
        tasksToUpdate.push(...childrenToUpdate);
        
        return tasksToUpdate;
    }
}