import fs from "fs/promises";
import path from "path";
import { loggers } from "./logger";

const logger = loggers.fileProcessing;

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensures the upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  const logComplete = logger.startOperation("ensureUploadDir", { path: UPLOAD_DIR });

  try {
    await fs.access(UPLOAD_DIR);
    logger.debug("Upload directory already exists");
  } catch {
    logger.info("Creating upload directory");
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info("Upload directory created successfully");
  }

  logComplete();
}

/**
 * Saves an uploaded file to the filesystem
 * Returns the relative path to the saved file
 */
export async function saveUploadedFile(file: File, userId: string): Promise<string> {
  const logComplete = logger.startOperation("saveUploadedFile", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId,
  });

  try {
    await ensureUploadDir();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${userId}_${timestamp}_${sanitizedName}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    logger.debug("Writing file to disk", {
      filepath,
      bufferSize: buffer.length,
    });

    await fs.writeFile(filepath, buffer);

    const relativePath = `/uploads/${filename}`;
    logger.info("File saved successfully", {
      relativePath,
      originalName: file.name,
      savedSize: buffer.length,
    });

    logComplete();
    return relativePath;
  } catch (error) {
    logger.error("Failed to save uploaded file", error, {
      fileName: file.name,
      userId,
    });
    throw error;
  }
}

/**
 * Reads a file and returns its content as base64 and metadata for Claude API
 */
export async function readFileForClaude(
  filepath: string,
  mimeType: string
): Promise<{ data: string; mediaType: string; isDocument: boolean }> {
  const logComplete = logger.startOperation("readFileForClaude", {
    filepath,
    mimeType,
  });

  try {
    const absolutePath = filepath.startsWith("/uploads")
      ? path.join(process.cwd(), filepath)
      : filepath;

    logger.debug("Reading file", { absolutePath });

    const buffer = await fs.readFile(absolutePath);
    const base64 = buffer.toString("base64");

    // Determine if it's a document (PDF) or text
    const isDocument = mimeType === "application/pdf";

    logger.info("File read and encoded successfully", {
      filepath,
      bufferSize: buffer.length,
      base64Length: base64.length,
      isDocument,
    });

    logComplete();

    return {
      data: base64,
      mediaType: mimeType,
      isDocument,
    };
  } catch (error) {
    logger.error("Failed to read file for Claude", error, {
      filepath,
      mimeType,
    });
    throw error;
  }
}

/**
 * Reads a text file and returns its content as string
 */
export async function readTextFile(filepath: string): Promise<string> {
  const logComplete = logger.startOperation("readTextFile", { filepath });

  try {
    const absolutePath = filepath.startsWith("/uploads")
      ? path.join(process.cwd(), filepath)
      : filepath;

    logger.debug("Reading text file", { absolutePath });

    const content = await fs.readFile(absolutePath, "utf-8");

    logger.info("Text file read successfully", {
      filepath,
      contentLength: content.length,
    });

    logComplete();
    return content;
  } catch (error) {
    logger.error("Failed to read text file", error, { filepath });
    throw error;
  }
}

/**
 * Deletes uploaded files
 */
export async function deleteUploadedFiles(filepaths: string[]): Promise<void> {
  const logComplete = logger.startOperation("deleteUploadedFiles", {
    fileCount: filepaths.length,
    filepaths,
  });

  let deletedCount = 0;
  let errorCount = 0;

  for (const filepath of filepaths) {
    try {
      const absolutePath = filepath.startsWith("/uploads")
        ? path.join(process.cwd(), filepath)
        : filepath;

      logger.debug("Deleting file", { filepath, absolutePath });

      await fs.unlink(absolutePath);
      deletedCount++;

      logger.debug("File deleted successfully", { filepath });
    } catch (error) {
      errorCount++;
      logger.error(`Failed to delete file: ${filepath}`, error, { filepath });
    }
  }

  logger.info("Batch file deletion completed", {
    totalFiles: filepaths.length,
    deletedCount,
    errorCount,
  });

  logComplete();
}
