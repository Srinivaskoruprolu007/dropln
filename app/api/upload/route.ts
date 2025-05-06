import { auth } from "@clerk/nextjs/server";
import { files } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { imagekit, userId: bodyUserId } = body;
    if (bodyUserId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!imagekit || !imagekit.url) {
      return NextResponse.json(
        { message: "Invalid file upload data" },
        { status: 401 }
      );
    }
    const fileData = {
      name: imagekit.name || "untitled",
      path: imagekit.filePath || `droplne/${userId}/${imagekit.name}`,
      size: imagekit.size || 0,
      userId: userId,
      type: imagekit.fileType || "image",
      fileUrl: imagekit.url,
      thumbnailUrl: imagekit.thumbnailUrl || null,
      parentId: null,
      isFolder: false,
      isStarred: false,
      isDeleted: false,
    };
    const newFile = await db.insert(files).values(fileData).returning();
    return NextResponse.json(newFile);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to upload image or save the resources" },
      { status: 500 }
    );
  }
}
