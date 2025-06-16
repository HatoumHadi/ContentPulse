import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email authentication support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resources table for tracking aggregated content sources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  url: text("url"),
  keywords: text("keywords"),
  title: text("title"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content table for storing aggregated content from various platforms
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  platform: varchar("platform").notNull(), // 'instagram', 'facebook', 'x', 'website'
  externalId: text("external_id"),
  title: text("title"),
  description: text("description"),
  content: text("content"),
  authorName: text("author_name"),
  authorImage: text("author_image"),
  imageUrl: text("image_url"),
  url: text("url"),
  publishedAt: timestamp("published_at"),
  engagement: jsonb("engagement"), // likes, comments, shares, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics table for storing aggregated metrics
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  platform: varchar("platform").notNull(),
  metric: varchar("metric").notNull(), // 'articles_published', 'social_interactions', etc.
  value: integer("value").notNull(),
  period: varchar("period").notNull(), // 'hour', 'day', 'week'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Folders/Collections table for organizing saved articles
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorite articles table for articles that show analytics dashboards
export const favoriteArticles = pgTable("favorite_articles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  folderId: integer("folder_id").references(() => folders.id).notNull(),
  contentId: integer("content_id").references(() => content.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  dashboardName: varchar("dashboard_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved searches table for storing search criteria in folders
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  folderId: integer("folder_id").references(() => folders.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  searchName: varchar("search_name").notNull(),
  url: text("url"),
  keywords: text("keywords"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavoriteArticleSchema = createInsertSchema(favoriteArticles).omit({
  id: true,
  createdAt: true,
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type FavoriteArticle = typeof favoriteArticles.$inferSelect;
export type InsertFavoriteArticle = z.infer<typeof insertFavoriteArticleSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
