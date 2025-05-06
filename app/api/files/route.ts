import { auth } from "@clerk/nextjs/server";
import { files } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get("parentId");
    const queryUserId = searchParams.get("userId");
    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // featch files from database
    let userFiles;
    if (parentId) {
      userFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.parentId, parentId),
            eq(files.userId, userId),
            eq(files.isDeleted, false)
          )
        );
    } else {
      userFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.userId, userId),
            eq(files.isDeleted, false),
            isNull(files.parentId)
          )
        );
    }
    return NextResponse.json(userFiles);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
