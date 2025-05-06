import { auth } from "@clerk/nextjs/server";
import { files } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { v4 } from "uuid";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY! || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY! || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT! || "",
});
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const formUserId = formData.get("userId") as string;
    const formParentId = (formData.get("parentId") as string) || null;
    if (formUserId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!file) {
      return NextResponse.json(
        { message: "Invalid file upload data" },
        { status: 401 }
      );
    }
    if (formParentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, formParentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );
      if (!parentFolder) {
        return NextResponse.json(
          { message: "Invalid parent folder" },
          { status: 401 }
        );
      }
    }
    if (!formParentId) {
      return NextResponse.json(
        { message: "Invalid parent folder" },
        { status: 401 }
      );
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only images and PDFs are supported" },
        { status: 401 }
      );
    }
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);
    const folderPath = formParentId
      ? `/dropln/${userId}/folder/${formParentId}`
      : `/dropln/${userId}`;
    const originalFileName = file.name;
    const fileExtension = originalFileName.split(".").pop() || "";
    const uniqueFileName = `${v4()}.${fileExtension}`;
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: uniqueFileName,
      folder: folderPath,
      useUniqueFileName: false,
    });
    const fileData = {
      userId,
      parentId: formParentId,
      name: originalFileName,
      path: uploadResponse.filePath,
      size: file.size,
      fileUrl: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || null,
      type: file.type,
      isFolder: false,
      isStarred: false,
      isDeleted: false,
    };
    const [newFile] = await db.insert(files).values(fileData).returning();
    return NextResponse.json({
      message: "File uploaded successfully",
      file: newFile,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "failed to fetch imagekit auth" },
      { status: 500 }
    );
  }
}
