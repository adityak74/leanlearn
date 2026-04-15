# Research - 02 Learning Architecture

## Schema Patterns (LearnHouse-inspired)

### `courses` Table
- `id`: text, primary key (cuid or uuid)
- `slug`: text, unique, not null (for clean URLs like /course/hypermemory)
- `title`: text, not null
- `description`: text
- `image_url`: text (optional)
- `created_at`: timestamp, default now
- `updated_at`: timestamp, default now

### `chapters` Table
- `id`: text, primary key
- `course_id`: text, references courses(id)
- `title`: text, not null
- `description`: text
- `sort_order`: integer, not null (for deterministic ordering)
- `created_at`: timestamp, default now

### `activities` Table
- `id`: text, primary key
- `chapter_id`: text, references chapters(id)
- `title`: text, not null
- `type`: text, not null (e.g., 'text', 'video')
- `content`: text (markdown content or video URL)
- `required`: integer/boolean, not null, default 1 (per REQ-COURSE-03)
- `sort_order`: integer, not null (for deterministic ordering)
- `created_at`: timestamp, default now

## Course Data Seeding
Initial course "Hypermemory" structure:
- 1 Course: Hypermemory
- 2 Chapters:
  - Chapter 1: Foundations of Memory (sort_order: 1)
  - Chapter 2: The Method of Loci (sort_order: 2)
- 3+ Activities:
  - Activity 1.1: Introduction (text, required: true, sort_order: 1)
  - Activity 1.2: Neural Plasticity (video, required: false, sort_order: 2)
  - Activity 2.1: Building your first Palace (text, required: true, sort_order: 1)

## API Design
- `GET /api/course/:slug`: Returns a course object with nested chapters and activities.
- `GET /api/me/courses`: Returns a list of courses the user can access. For now, a simple `courses.all()` list.

## UI Components
- Course Sidebar: Nested list (Chapters -> Activities) with active state highlighting.
- Course Content: Renders activity title and content based on type.
