import { z } from "zod";

const name = z.string().trim().min(1, "Name is required").max(100, "Name is too long");
const icon = z.string().trim().min(1).max(8, "Icon is too long");

export const folderCreateSchema = z.object({
  name,
  icon: icon.optional(),
  is_public: z.boolean().optional(),
});

export const folderUpdateSchema = z.object({
  name: name.optional(),
  icon: icon.optional(),
  is_pinned: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

export const folderAddRepoSchema = z.object({
  repoId: z.string().uuid("Invalid repo ID"),
});

const ghSegment = z.string().trim().regex(/^[\w.-]{1,100}$/, "Invalid GitHub name");

export const repoAddSchema = z.object({
  repo_owner: ghSegment,
  repo_name: ghSegment,
});

/** Formats the first zod issue as a short error message. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
