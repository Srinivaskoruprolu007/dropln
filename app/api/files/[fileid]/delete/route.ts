import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ fileid: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { fileid } = await props.params;
    if (!fileid) {
      return NextResponse.json(
        { message: "File id is required" },
        { status: 401 }
      );
    }
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileid), eq(files.userId, userId)));
    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 401 });
    }
    // toggle isDeleted
    const updatedFiles = await db
      .update(files)
      .set({ isDeleted: !file.isDeleted })
      .where(and(eq(files.id, fileid), eq(files.userId, userId)))
      .returning();
      
    const updatedFile = updatedFiles[0];
    return NextResponse.json(updatedFile);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete file" },
      { status: 500 }
    );
  }
}
