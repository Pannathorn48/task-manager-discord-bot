# Task Manager Discord Bot

A comprehensive Discord bot for managing tasks with nested subtask support, progress tracking, and visual progress bars.

## Features

### Task Management
- **Create Tasks**: Create new tasks with optional descriptions and parent tasks for nesting
- **Task Status**: Four status levels (Created, Doing, Done, Closed)
- **Nested Tasks**: Support for subtasks with automatic progress calculation
- **User Assignment**: Assign tasks to specific users in your Discord server
- **Progress Visualization**: Visual progress bars and emoji indicators with real-time overview
- **Task Statistics**: Overview of your task completion statistics
- **Channel Notifications**: Automatic notifications with progress overview to configured channels
- **Task Lifecycle**: Complete task management from creation to closure

### Commands

#### `/task-create`
Create a new task

- `name` (required): Name of the task
- `description` (optional): Description of the task
- `parent` (optional): ID of parent task for creating subtasks
- `assignee` (optional): User to assign this task to

#### `/task-list`
List all your tasks with hierarchical structure

- `filter` (optional): Filter by status (created/doing/done/closed)
- `search` (optional): Search tasks by name or description
- `assignee` (optional): Show only tasks assigned to this user
- `unassigned` (optional): Show only unassigned tasks

#### `/task-edit`
Edit an existing task

- `id` (required): Task ID
- `name` (optional): New name for the task
- `description` (optional): New description
- `status` (optional): New status (created/doing/done/closed)
- `assignee` (optional): Assign task to a user

#### `/task-delete`
Delete a task and all its subtasks

- `id` (required): Task ID

#### `/task-stats`
Show your task completion statistics

#### `/task-assign`
Assign a task to a user

- `id` (required): Task ID
- `user` (required): User to assign the task to

#### `/task-unassign`
Remove assignment from a task

- `id` (required): Task ID

#### `/task-assigned`
View tasks assigned to a specific user

- `user` (required): User to view assigned tasks for

#### `/done`
Mark a task as done (shows in-progress tasks to choose from)

- `id` (required): Task ID to mark as done

#### `/accept`
Accept a task (move from created to doing)

- `id` (required): Task ID to accept

#### `/close`
Close a task (removes it from active task lists)

- `id` (required): Task ID to close

## Example Usage

```bash
/task-create name:"Frontend Development" description:"Build the user interface"
/task-create name:"Login Page" parent:1 description:"Create user authentication page"
/task-create name:"Dashboard" parent:1 description:"Main user dashboard"
/accept id:2
/done id:2
/task-list
/close id:4
```

### Example Task Hierarchy

```text
✅ Frontend Development (ID: 1)
██████░░░░ 67%
├─ ✅ Login Page (ID: 2)
│   ████████████ 100%
│   Create user authentication page
├─ 🔄 Dashboard (ID: 3)
│   ░░░░░░░░░░░░ 0%
│   Main user dashboard
├─ 🔒 Settings Page (ID: 4)
│   ░░░░░░░░░░░░ 0%
│   User preferences and configuration (closed)
└─ ⭕ Profile Page (ID: 5)
    ░░░░░░░░░░░░ 0%
    User profile management
```

## Setup

### Prerequisites

- Node.js 18+
- Discord Bot Token
- Docker and Docker Compose

### Environment Setup

1. Copy `.env.example` to `.env`

2. Fill in your Discord bot credentials:

```env
TOKEN=your_discord_bot_token
APP_ID=your_app_id
PUBLIC_KEY=your_public_key
CHANNEL_ID=your_channel_id

PG_DATABASE=your-database
PG_HOST=your-host
PG_USER=your-user
PG_PASSWORD=your-password
PG_PORT=your-port
```


**Step by Step:**

1. Register Discord commands:

```bash
pnpm run register
```

2. Start all services:

```bash
pnpm run docker:up
```

3. View logs:

```bash
pnpm run docker:logs
```

### Useful Commands

```bash
# Stop all services
pnpm run docker:down

# Restart everything
pnpm run docker:rebuild

```

### Database

The bot uses PostgreSQL with the following schema:

- **tasks**: Main table storing all tasks with hierarchical relationships
- **Indexes**: Optimized for guild_id, user_id, parent_id, and status queries
- **Triggers**: Automatic timestamp updates

### Channel Notifications

Configure `CHANNEL_ID` in your `.env` to receive automatic notifications with progress overviews when:

- Tasks are created
- Tasks are accepted/started
- Tasks are completed
- Tasks are closed

### Task Status Behavior

- **Active tasks**: Created, Doing, and Done tasks appear in normal lists
- **Closed tasks**: Hidden from normal views, only visible when specifically filtered
- **Progress calculation**: Only "Done" tasks count as 100% complete; all others show 0%

### Progress Calculation

- **Leaf tasks**: Progress based on status (Created: 0%, Doing: 0%, Done: 100%, Closed: 0%)
- **Parent tasks**: Progress calculated from completed subtasks percentage
- **Visual indicators**: Progress bars and status emojis for quick overview
- **Real-time notifications**: Channel notifications include overall progress overview

## Development

### Project Structure
```
src/
├── commands/           # Command handlers
├── database/          # Database connection and migrations
├── models/            # TypeScript interfaces
├── services/          # Business logic
├── utils/             # Utility functions
├── index.ts           # Main bot file
└── register.ts        # Command registration
```

### Adding New Commands

1. Add command definition to `register.ts`
2. Create handler method in `TaskCommandHandler.ts`
3. Add case to interaction handler in `index.ts`

## Troubleshooting

### Common Issues

1. **Database connection failed**: Ensure PostgreSQL is running and credentials are correct
2. **Commands not appearing**: Re-run the register script and wait a few minutes
3. **Permission errors**: Ensure bot has necessary permissions in your Discord server

### Logs

Check Docker logs for database issues:
```bash
docker-compose logs postgres
docker-compose logs ts-service
```
