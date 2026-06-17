# HelloTasks Roles and Permissions

## Purpose

HelloTasks needs a role system that allows one user to have different permissions depending on the workspace or project they are working on.

A user should not have one fixed role across the whole app.

Example:

```txt
Henz
- Default role: viewer
- Workspace role in HelloTasks Development: member
- Project role in UI Design: manager
- Project role in Backend API: viewer
- Project role in QA Testing: quality_manager
```

This makes HelloTasks flexible for teams, capstone groups, academic projects, freelance work, and future Hello ecosystem apps.

## Core Rule

Roles must be checked based on context.

```txt
Project role wins.
Workspace role is next.
Default role is fallback.
No membership means no access.
```

Recommended backend logic:

```txt
If user has an active project role:
  use project role

Else if user has an active workspace role:
  use workspace role

Else if user has valid access context:
  use default role

Else:
  deny access
```

The default role should not automatically give access to every workspace or project.

## Authentication and Authorization

Authentication and authorization must stay separate.

```txt
Authentication = Who is this user?
Authorization = What can this user do here?
```

For HelloTasks:

```txt
Authentication: MongoDB-based HelloTasks account
Authorization: MongoDB-based workspace and project roles
```

Supabase Auth should not be used as the primary authentication system for HelloTasks.

## Role Scope

HelloTasks should support three role scopes.

```txt
System-level role
Workspace-level role
Project-level role
```

### System-Level Role

Used only for platform maintenance.

Recommended values:

```txt
system_admin
user
```

Rules:

- Keep this minimal.
- Do not use `admin` broadly.
- A system admin should not automatically become owner of every workspace.
- System-level roles should not replace workspace or project permissions.

### Workspace-Level Role

Used inside a workspace.

MVP workspace roles:

```txt
owner
manager
quality_manager
member
viewer
```

For the MVP, workspace roles can control most access.

### Project-Level Role

Used inside a specific project.

Recommended future project roles:

```txt
project_manager
quality_manager
developer
member
viewer
```

Project-level roles should be added when the system needs more detailed access control per project.

## Main Roles

### Owner

The owner controls the workspace.

Typical users:

- Founder
- Project head
- Team leader
- Capstone leader
- Organization owner

Can:

- Create workspace
- Edit workspace settings
- Archive workspace
- Add members
- Remove members
- Assign roles
- Create projects
- Archive projects
- View all tickets in the workspace
- Create tickets
- Assign tickets
- Review tickets
- Approve or return tickets
- View reports
- Export reports

Should not usually:

- Permanently delete records without confirmation
- Approve their own submitted work if self-approval is disabled

### Manager

The manager plans, assigns, and monitors work.

Typical users:

- Project manager
- Team lead
- Instructor managing a group
- Capstone leader
- Freelance project lead

Can:

- Create projects if allowed by owner
- Create tickets
- Edit tickets
- Assign tickets
- Change priority
- Change due date
- Add acceptance criteria
- View team progress
- Review submitted work
- Approve tickets
- Return tickets
- Mark tickets as blocked
- Generate reports

Cannot by default:

- Delete workspace
- Remove owner
- Change billing or ecosystem settings
- Access unrelated workspaces

### Quality Manager

The quality manager checks work before acceptance.

Typical users:

- QA lead
- Tester
- Reviewer
- Instructor checker
- Capstone documentation checker

Can:

- Create bug tickets
- Create testing tasks
- Add acceptance criteria
- Add review notes
- Mark tickets as for review
- Approve tested work
- Return work for revision
- Mark QA status
- View reports

Cannot by default:

- Delete projects
- Manage workspace ownership
- Remove members unless allowed

### Member

The member performs assigned work.

Typical users:

- Developer
- Designer
- Writer
- Student member
- QA member
- Freelancer assistant

Can:

- View assigned tickets
- View project tickets if allowed
- Start assigned tasks
- Add progress notes
- Ask clarifications
- Reply to clarification threads
- Add branch name
- Add commit URL
- Add pull request URL
- Upload proof files if allowed
- Submit work for review
- Mark own task as blocked

Cannot by default:

- Approve own ticket
- Delete tickets
- Assign tickets to others
- Change roles
- Remove members
- View private projects they are not part of

### Viewer

The viewer has read-only access.

Typical users:

- Client
- Adviser
- Instructor
- Stakeholder
- Observer

Can:

- View invited workspaces or projects
- View tickets if allowed
- View progress reports
- View completed tasks
- View blocked tasks
- View activity timeline

Cannot:

- Create tickets
- Edit tickets
- Add progress notes
- Submit work
- Approve work
- Return work
- Delete anything

## Permission Matrix

| Action | Owner | Manager | Quality Manager | Member | Viewer |
|---|---:|---:|---:|---:|---:|
| Create workspace | Yes | No | No | No | No |
| Edit workspace | Yes | Limited | No | No | No |
| Archive workspace | Yes | No | No | No | No |
| Add members | Yes | Yes | No | No | No |
| Remove members | Yes | Limited | No | No | No |
| Change member roles | Yes | Limited | No | No | No |
| Create project | Yes | Yes | Limited | No | No |
| Edit project | Yes | Yes | Limited | No | No |
| Archive project | Yes | Yes | No | No | No |
| Create ticket | Yes | Yes | Yes | Limited | No |
| Edit ticket | Yes | Yes | Limited | Own only if allowed | No |
| Assign ticket | Yes | Yes | Limited | No | No |
| Start assigned task | Yes | Yes | Yes | Yes | No |
| Add progress note | Yes | Yes | Yes | Yes | No |
| Ask clarification | Yes | Yes | Yes | Yes | No |
| Add review note | Yes | Yes | Yes | No | No |
| Submit for review | Yes | Yes | Yes | Yes | No |
| Approve ticket | Yes | Yes | Yes | No | No |
| Return ticket | Yes | Yes | Yes | No | No |
| Mark blocked | Yes | Yes | Yes | Yes | No |
| Delete ticket | Yes | Limited | No | No | No |
| View reports | Yes | Yes | Yes | Limited | Yes |
| Export reports | Yes | Yes | Limited | No | Limited |

## Database Structure

Do not store all workspace and project roles directly inside the user document.

A user can have different roles in different workspaces and projects.

### Users Collection

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  defaultRole: "viewer",
  systemRole: "user",
  status: "active",
  createdAt: Date,
  updatedAt: Date
}
```

Recommended `defaultRole`:

```txt
viewer
```

Recommended `systemRole` values:

```txt
user
system_admin
```

### Workspace Members Collection

```js
{
  _id: ObjectId,
  workspaceId: ObjectId,
  userId: ObjectId,
  role: "member",
  status: "active",
  invitedBy: ObjectId,
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Recommended workspace role values:

```txt
owner
manager
quality_manager
member
viewer
```

Recommended membership status values:

```txt
invited
active
suspended
removed
```

### Project Members Collection

```js
{
  _id: ObjectId,
  projectId: ObjectId,
  workspaceId: ObjectId,
  userId: ObjectId,
  role: "member",
  status: "active",
  invitedBy: ObjectId,
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Recommended future project role values:

```txt
project_manager
quality_manager
developer
member
viewer
```

For MVP, project members can be optional if workspace roles are enough.

## Effective Role

The backend should compute an effective role when the user performs an action.

Do not permanently store `effectiveRole`.

Example:

```txt
effectiveRole = projectRole || workspaceRole || defaultRole
```

The effective role should be computed using:

```txt
userId
workspaceId
projectId
action
membership status
ticket ownership
workspace settings
```

## Permission Check Flow

Example: Approving a ticket.

```txt
1. User sends approve request.
2. Backend checks if the user is authenticated.
3. Backend gets userId from the session or token.
4. Backend finds the ticket.
5. Backend identifies the ticket workspaceId and projectId.
6. Backend checks project_members for active project role.
7. If no project role exists, backend checks workspace_members for active workspace role.
8. If no membership exists, backend denies access.
9. Backend computes effectiveRole.
10. Backend checks if effectiveRole can approve tickets.
11. Backend checks if ticket status is for_review.
12. Backend checks if self-approval is allowed.
13. Backend updates the ticket if allowed.
14. Backend creates activity log.
15. Backend returns response.
```

## Sample Middleware Logic

```js
async function getEffectiveRole({ userId, workspaceId, projectId }) {
  if (projectId) {
    const projectMember = await ProjectMember.findOne({
      userId,
      projectId,
      status: "active"
    });

    if (projectMember) {
      return {
        scope: "project",
        role: projectMember.role
      };
    }
  }

  const workspaceMember = await WorkspaceMember.findOne({
    userId,
    workspaceId,
    status: "active"
  });

  if (workspaceMember) {
    return {
      scope: "workspace",
      role: workspaceMember.role
    };
  }

  return null;
}
```

```js
function canApproveTicket(role) {
  return ["owner", "manager", "quality_manager", "project_manager"].includes(role);
}
```

```js
async function requireTicketApprovalPermission(req, res, next) {
  const userId = req.user._id;
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found." });
  }

  const effectiveRole = await getEffectiveRole({
    userId,
    workspaceId: ticket.workspaceId,
    projectId: ticket.projectId
  });

  if (!effectiveRole) {
    return res.status(403).json({ message: "You do not have access to this ticket." });
  }

  if (!canApproveTicket(effectiveRole.role)) {
    return res.status(403).json({ message: "You do not have permission to approve this ticket." });
  }

  req.ticket = ticket;
  req.effectiveRole = effectiveRole;
  next();
}
```

## Self-Approval Rule

By default, users should not approve their own submitted work.

Recommended default:

```txt
allowSelfApproval: false
```

Example check:

```txt
If ticket.submittedBy equals current user:
  deny approval unless allowSelfApproval is true
```

This helps protect the review process for capstone groups, academic projects, and client work.

## Workspace Settings for Future Flexibility

For MVP, fixed role permissions are enough.

Future workspace settings can make permissions more flexible.

Recommended settings:

```js
{
  membersCanCreateTickets: true,
  membersCanViewAllProjectTickets: false,
  managersCanInviteMembers: true,
  qualityManagersCanApprove: true,
  allowSelfApproval: false
}
```

These settings should not replace role checks.

They should only refine what each role can do.

## Frontend Rule

The frontend can hide or show buttons based on the effective role.

Example:

```txt
Members should not see the Approve button.
Viewers should not see the Create Ticket button.
Managers should see assignment and review controls.
```

Backend checks are still required.

Never trust frontend role checks alone.

## API Rule

Every protected API route should check:

```txt
1. Is the user authenticated?
2. Does the user have active access to this workspace or project?
3. What is the user's effective role?
4. Is this role allowed to perform this action?
5. Are there extra rules for this action?
```

Extra rules may include:

- Ticket must be assigned to the user.
- Ticket must be in the correct status.
- User cannot approve own submission.
- Project must not be archived.
- Workspace membership must be active.

## MVP Recommendation

Use this for the first working version:

```txt
users.defaultRole = viewer
workspace_members.role = owner | manager | quality_manager | member | viewer
workspace_members.status = invited | active | suspended | removed
```

Project roles can be delayed unless the first version needs per-project permissions.

Use workspace role as the main access control in MVP.

## Future Expansion

Later versions can add:

- Project-level roles
- Custom role permissions
- Department-level or organization-level roles
- Read-only client portals
- Temporary guest access
- Audit logs for role changes
- Role templates for academic, freelance, and software teams

## Hello Ecosystem Rule

One user can have different roles across Hello apps.

Example:

```txt
HelloRun: organizer
HelloUniversity: instructor
HelloTasks: manager
HelloDental: viewer
```

A user who is an admin in one Hello app should not automatically become an admin in another Hello app.

Each app must check its own roles.

## Final Implementation Decision

HelloTasks will use a context-based role system.

Final rule:

```txt
User account is global.
Default role is viewer.
Workspace role controls workspace access.
Project role can override workspace role.
No active membership means no access.
Backend permission checks are required for every protected action.
```
