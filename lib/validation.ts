import { z } from "zod";
import { MAX_BULK_REPOS } from "@/lib/repo-query";

const name = z.string().trim().min(1, "Name is required").max(100, "Name is too long");
const icon = z.string().trim().min(1).max(8, "Icon is too long");
const parentId = z.string().uuid("Invalid parent folder").nullable();
const repoIds = z
  .array(z.string().uuid("Invalid repo ID"))
  .min(1, "Select at least one repository")
  .max(MAX_BULK_REPOS, `Select at most ${MAX_BULK_REPOS} repositories`);

export const folderCreateSchema = z.object({
  name,
  icon: icon.optional(),
  is_public: z.boolean().optional(),
  parent_id: parentId.optional(),
});

export const folderUpdateSchema = z.object({
  name: name.optional(),
  icon: icon.optional(),
  is_pinned: z.boolean().optional(),
  is_public: z.boolean().optional(),
  parent_id: parentId.optional(),
  repo_sort: z.enum(["manual", "updated", "stars", "name", "added"]).optional(),
});

/** Accepts one `repoId` or a `repoIds` list and normalizes to a unique list. */
export const folderAddRepoSchema = z
  .object({
    repoId: z.string().uuid("Invalid repo ID").optional(),
    repoIds: repoIds.optional(),
  })
  .transform((value) => [
    ...new Set(value.repoIds ?? (value.repoId ? [value.repoId] : [])),
  ])
  .refine((ids) => ids.length > 0, "Select at least one repository");

export const folderRemoveReposSchema = z.object({ repoIds });

export const repoBulkUpdateSchema = z.object({
  repoIds,
  is_favorite: z.boolean(),
});

export const folderReorderSchema = z.object({
  parent_id: parentId,
  folderIds: z.array(z.string().uuid("Invalid folder ID")).min(1).max(500),
});

export const folderRepoReorderSchema = z.object({ repoIds });

const ghSegment = z.string().trim().regex(/^[\w.-]{1,100}$/, "Invalid GitHub name");

export const repoAddSchema = z.object({
  repo_owner: ghSegment,
  repo_name: ghSegment,
});

/** Formats the first zod issue as a short error message. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

/**
 * Returns the message of a database error the user can act on (SQLSTATE NR001,
 * raised by the folder hierarchy rules), or null for anything else.
 */
export function userFacingDbError(error: unknown): string | null {
  const dbError = error as { code?: string; message?: string } | null;
  return dbError?.code === "NR001" ? (dbError.message ?? "Invalid request") : null;
}
