export const MAX_PROJECT_NAME = 60;
export const MAX_PROJECT_DESCRIPTION = 200;

export type ProjectField = 'name' | 'description' | 'participants';
export type ProjectErrorCode = 'REQUIRED' | 'TOO_LONG' | 'EMPTY_LIST';

export type ProjectErrors = Partial<Record<ProjectField, ProjectErrorCode>>;

export interface ProjectInput {
  name: string;
  description: string;
}

export function normalizeProjectText(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function normalizeProjectInput(input: ProjectInput): ProjectInput {
  return {
    name: normalizeProjectText(input.name),
    // keep line breaks in descriptions but trim the ends
    description: input.description.normalize('NFC').trim(),
  };
}

/** Validates a project form. `participantCount` is only checked when provided (creation flow). */
export function validateProject(input: ProjectInput, participantCount?: number): ProjectErrors {
  const errors: ProjectErrors = {};
  const { name, description } = normalizeProjectInput(input);
  if (!name) errors.name = 'REQUIRED';
  else if (Array.from(name).length > MAX_PROJECT_NAME) errors.name = 'TOO_LONG';
  if (Array.from(description).length > MAX_PROJECT_DESCRIPTION) errors.description = 'TOO_LONG';
  if (participantCount !== undefined && participantCount <= 0) errors.participants = 'EMPTY_LIST';
  return errors;
}

export function hasErrors(errors: ProjectErrors): boolean {
  return Object.keys(errors).length > 0;
}
