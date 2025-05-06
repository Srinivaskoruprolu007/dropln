import { auth } from "@clerk/nextjs/server";
import { files } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { v4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name, userId: bodyUserId, parentId = null } = body;
    if (bodyUserId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "Invalid file upload data" },
        { status: 401 }
      );
    }
    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );
      if (!parentFolder) {
        return NextResponse.json(
          { message: "Invalid folder" },
          { status: 401 }
        );
      }
    }
    // create a folder in database
    const folderData = {
      id: v4(),
      name: name.trim(),
      path: `/folders/${userId}/${v4()}`,
      size: 0,
      type: "folder",
      fileUrl: "",
      thumbnailUrl: null,
      userId,
      parentId,
      isFolder: true,
      isStarred: false,
      isDeleted: false,
    };
    const [newFolder] = await db.insert(files).values(folderData).returning();
    return NextResponse.json({
      message: "Folder created successfully",
      success: true,
      folder: newFolder,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create a folder or save the resources" },
      { status: 500 }
    );
  }
}
