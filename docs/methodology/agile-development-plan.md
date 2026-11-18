# FoundIt – Agile Development Plan

## 1. Introduction

FoundIt will adopt the Agile Software Development Model. Agile is an iterative and incremental approach that allows the development team to build the system in manageable parts, test completed features, identify problems, and make improvements throughout development.

The approach is suitable for FoundIt because the system contains several distinct features that can be developed and integrated progressively.

## 2. Agile Development Process

The team will follow these activities:

1. **Requirements Planning:** Identify user needs, project objectives, system requirements, and priorities.
2. **Task Planning:** Break the system into smaller features and assign responsibilities.
3. **Incremental Development:** Develop the system feature by feature.
4. **Continuous Testing:** Test completed features and correct identified errors.
5. **Review:** Evaluate progress and make necessary adjustments.
6. **Final Integration and Delivery:** Combine the completed features, conduct final testing, and prepare the application for presentation.

## 3. Product Backlog

The product backlog contains the main features to be developed, arranged by priority.

| Priority | Feature | Description |
|---|---|---|
| High | Authentication | Student registration and login |
| High | Item reporting | Report lost or found belongings |
| High | Item browsing | View reported items |
| High | Search and filtering | Find items by name, category, location, etc. |
| High | Ownership claims | Submit claims for found belongings |
| High | Claim management | Administrators review claims |
| High | Report management | Administrators manage reported items |
| Medium | Student dashboard | View personal reports and claims |
| Medium | Admin dashboard | View and manage system activity |
| Medium | Notifications | Notify users about relevant updates |
| Medium | Responsive design | Support desktop and mobile devices |

## 4. Proposed Development Sprints

The following is a suggested sprint structure. The team may adjust the duration and combine stages depending on the actual deadline.

### Sprint 1: Planning and System Design

**Objective:** Establish the project requirements and technical foundation.

Activities:
- Identify functional and non-functional requirements.
- Complete relevant user research.
- Define system architecture.
- Prepare use-case, activity, sequence, and ER diagrams.
- Finalize UI designs.
- Set up the GitHub repository and development environment.
- Agree on the technology stack.

Deliverables:
- Requirements document.
- System design diagrams.
- UI mockups.
- Project structure and development setup.

### Sprint 2: Authentication and User Interface

**Objective:** Establish the basic application structure and user access.

Activities:
- Develop registration and login interfaces.
- Implement authentication.
- Create student and administrator dashboard layouts.
- Implement navigation and responsive layouts.
- Establish user roles and access restrictions.

Deliverables:
- Working registration and login.
- Student dashboard.
- Administrator dashboard foundation.
- Role-based access functionality.

### Sprint 3: Lost and Found Reporting

**Objective:** Allow students to submit lost and found reports.

Activities:
- Create the report-item form.
- Implement lost/found report categories.
- Add item descriptions, dates, locations, and image uploads.
- Validate submitted information.
- Save reports to the database.

Deliverables:
- Functional lost-item reporting.
- Functional found-item reporting.
- Report storage and retrieval.

### Sprint 4: Browsing, Searching and Claims

**Objective:** Enable students to find items and submit ownership claims.

Activities:
- Display reported items.
- Implement search and filtering.
- Create item details pages.
- Develop the ownership claim form.
- Allow students to view their submitted claims.

Deliverables:
- Item browsing and searching.
- Item details.
- Claim submission.
- Student report and claim tracking.

### Sprint 5: Administration, Integration and Testing

**Objective:** Complete administrative functionality and prepare the application for delivery.

Activities:
- Implement administrative report management.
- Implement claim approval and rejection.
- Add appropriate item-status updates.
- Integrate frontend and backend features.
- Test major user workflows.
- Fix identified errors.
- Conduct final security and usability checks.

Deliverables:
- Functional administrative features.
- Integrated application.
- Test results.
- Final working version ready for presentation.

## 5. Suggested Team Responsibilities

These are suggested responsibilities, not confirmed assignments. The team should allocate them according to its actual membership and skills.

| Role | Responsibilities |
|---|---|
| Project Coordinator | Organizes tasks, monitors progress and coordinates team activities |
| Product Designer / Requirements Analyst | Documents requirements, prepares UI designs and ensures the system meets user needs |
| Frontend Developer(s) | Develops interfaces, navigation, forms and responsive layouts |
| Backend Developer(s) | Implements APIs, authentication, business logic and authorization |
| Database Developer | Designs database tables, relationships and data access |
| Tester / QA | Tests features, documents errors and verifies corrections |
| Documentation Lead | Maintains research, requirements, diagrams, methodology and testing documentation |

A team member may handle more than one responsibility where necessary.

## 6. GitHub Collaboration Workflow

The team will use GitHub to manage source code and coordinate development.

Suggested workflow:

1. Keep the main branch stable.
2. Create feature branches for individual tasks.
3. Developers work on their assigned features.
4. Commit changes regularly with meaningful messages.
5. Open pull requests when features are ready.
6. Review and test changes before merging into main.
7. Integrate features regularly to reduce conflicts.

Example branches:
- `feature/authentication`
- `feature/item-reporting`
- `feature/item-search`
- `feature/claims`
- `feature/admin-dashboard`

Never commit passwords, API keys, database credentials or `.env` files.

## 7. Team Progress and Reviews

To keep coordination manageable:

- Hold a short progress meeting regularly.
- Each member reports completed work, current tasks and blockers.
- Review completed features before integration.
- Update the task board as work progresses.
- Record important decisions and changes.

A simple GitHub Projects board or Trello board can use these columns:

- Backlog
- To Do
- In Progress
- Review
- Done

## 8. Definition of Done

A feature is considered complete when:

- Its required functionality has been implemented.
- Input validation has been included where necessary.
- Relevant errors have been handled.
- The feature has been tested.
- It works with the other integrated components.
- Changes have been reviewed and merged.
- Relevant documentation has been updated.

## 9. Expected Outcome

By following this Agile approach, the team aims to produce a functional, integrated and tested FoundIt application. Development will be organized into manageable increments, allowing progress to be monitored and issues to be addressed throughout the project.