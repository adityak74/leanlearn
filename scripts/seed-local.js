import Database from "better-sqlite3";
import * as fs from "fs";

const db = new Database("dev.db");

// Simple helper to execute SQL from the seed file
const seedSql = `
-- Seed Course
INSERT OR IGNORE INTO courses (id, slug, title, description, published, created_at, updated_at) 
VALUES ('course_1', 'hypermemory', 'Hypermemory', 'Master your memory with the Method of Loci and other advanced techniques.', 1, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now'));

-- Seed Chapters
INSERT OR IGNORE INTO chapters (id, course_id, title, sort_order, created_at)
VALUES ('chapter_1', 'course_1', 'Foundations of Memory', 1, strftime('%Y-%m-%d %H:%M:%S', 'now'));

INSERT OR IGNORE INTO chapters (id, course_id, title, sort_order, created_at)
VALUES ('chapter_2', 'course_1', 'The Method of Loci', 2, strftime('%Y-%m-%d %H:%M:%S', 'now'));

-- Seed Activities for Chapter 1
INSERT OR IGNORE INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_1_1', 'chapter_1', 'Introduction to Memory', 'text', '# Welcome to Hypermemory\\n\\nIn this course, you will learn how to unlock the true potential of your brain.', 1, 1, strftime('%Y-%m-%d %H:%M:%S', 'now'));

INSERT OR IGNORE INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_1_2', 'chapter_1', 'Neural Plasticity Explained', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0, 2, strftime('%Y-%m-%d %H:%M:%S', 'now'));

-- Seed Activities for Chapter 2
INSERT OR IGNORE INTO activities (id, chapter_id, title, type, content, required, sort_order, created_at)
VALUES ('activity_2_1', 'chapter_2', 'Building Your First Palace', 'text', 'Step 1: Choose a familiar place...\\nStep 2: Define your route...', 1, 1, strftime('%Y-%m-%d %H:%M:%S', 'now'));
`;

try {
  db.exec(seedSql);
  console.log("✅ Local dev.db seeded successfully!");
} catch (error) {
  console.error("❌ Error seeding local dev.db:", error);
} finally {
  db.close();
}
