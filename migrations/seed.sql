-- Seed Course
INSERT INTO courses (id, slug, title, description, published, created_at, updated_at) 
VALUES ('course_1', 'hypermemory', 'Hypermemory', 'Master your memory with the Method of Loci and other advanced techniques.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Chapters
INSERT INTO chapters (id, course_id, title, sort_order, created_at)
VALUES ('chapter_1', 'course_1', 'Foundations of Memory', 1, CURRENT_TIMESTAMP);

INSERT INTO chapters (id, course_id, title, sort_order, created_at)
VALUES ('chapter_2', 'course_1', 'The Method of Loci', 2, CURRENT_TIMESTAMP);

-- Seed Activities for Chapter 1
INSERT INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_1_1', 'chapter_1', 'Introduction to Memory', 'text', '# Welcome to Hypermemory\n\nIn this course, you will learn how to unlock the true potential of your brain.', 1, 1, CURRENT_TIMESTAMP);

INSERT INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_1_2', 'chapter_1', 'Neural Plasticity Explained', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0, 2, CURRENT_TIMESTAMP);

-- Seed Activities for Chapter 2
INSERT INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_2_1', 'chapter_2', 'Building Your First Palace', 'text', 'Step 1: Choose a familiar place...\nStep 2: Define your route...', 1, 1, CURRENT_TIMESTAMP);
