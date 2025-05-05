import { pgTable, text, uuid, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const files = pgTable("files", {
    id: uuid("id").defaultRandom().primaryKey(),
    name : text("name").notNull(),
    path : text("path").notNull(), // /documents/folder1/folder2/folder3
    size : integer("size").notNull(),
    type : text("type").notNull(), // folder or file

    // storage information
    fileUrl : text("file_url").notNull(), // url to access the file
    thumbnailUrl : text("thumbnail_url"), // url to access the thumbnail

    // ownership information
    userId : text('user_id').notNull(),
    parentId:uuid("parent_id"), // parent folder id if null then it is a root folder
    
    // file/folder flags
    isFolder : boolean("is_folder").default(false).notNull(),
    isStarred : boolean("is_starred").default(false).notNull(),
    isDeleted : boolean("is_deleted").default(false).notNull(),
    
    // timestamps
    createdAt : timestamp("created_at").defaultNow().notNull(),
    updatedAt : timestamp("updated_at").defaultNow().notNull(),
})

export const filesRelations = relations(files, ({one, many}) => ({
    parent: one(files, {
        fields:[files.parentId],
        references: [files.id]
    }),

    // relationship to child file/folder
    children: many(files)
}))

// Type definitions
export const File = typeof files.$inferSelect;
export const NewFile = typeof files.$inferInsert;