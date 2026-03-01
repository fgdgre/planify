import { z } from "zod";
import _ from "lodash";

type FilesMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf"
  | "text/plain"
  | "image/svg+xml";

type ValidationResult<T> = {
  success: boolean;
  error: Partial<Record<keyof T, string>> | null;
};

export type RuleMap = {
  required: { message: string };

  number: {
    message: string;
    rules?: {
      min?: { message: string; value: number };
      max?: { message: string; value: number };
      positive?: { message: string };
      integer?: { message: string };
    };
  };

  file: {
    message?: string;
    rules?: {
      extensions?: { message: string; value: FilesMimeType[] };
      /* max value set in bytes */
      maxSize?: { message: string; value: number };
    };
  };

  fileList: {
    message?: string;
    rules?: {
      extensions?: { message: string; value: FilesMimeType[] };
      /* max value set in bytes */
      maxSize?: { message: string; value: number };
      maxCount?: { message: string; value: number };
    };
  };

  email: {
    message: string;
  };

  length: {
    min?: { value: number; message: string };
    max?: { value: number; message: string };
  };

  alphanumeric: {
    message: string;
  };

  hasLetter: {
    message: string;
  };

  hasSpecialCharacter: {
    message: string;
  };

  matchWith: {
    value: any;
    message: string;
  };
};

export type FieldRules = {
  [K in keyof RuleMap]?: RuleMap[K];
};

export type ValidationSchema = {
  [fieldName: string]: FieldRules;
};

// ---------- helpers ----------

export const validateFileType = ({
 value,
 allowedMimeTypes
}: {
  value: File;
  allowedMimeTypes: string[];
}): boolean => {
  return allowedMimeTypes.map((t) => t.toLowerCase()).includes(value.type.toLowerCase());
};

export const validateMinLength = ({
  value,
  length
}: {
  value: { length: number };
  length: number;
}): boolean => value.length >= length;

export const validateMaxLength = ({
  value,
  length
}: {
  value: { length: number };
  length: number;
}): boolean => value.length <= length;

export const validateHasLetter = ({ value }: { value: string }): boolean => /[A-Za-z]/.test(value);

export const validateHasSpecialCharacter = ({ value }: { value: string }): boolean => /[\d\W]/.test(value);

export const validateFileSize = ({ value, maxSize }: { value: File; maxSize: number }): boolean => {
  return value.size <= maxSize;
};

export const validateMatchWith = ({ value, matchWith }: { value: any; matchWith: any }) => {
  return _.isEqual(value, matchWith);
};

export const validateDateBefore = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  if (startDate.getTime() > endDate.getTime()) {
    return { success: false, error: true };
  }
  return { success: true };
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === "object" && value !== null) return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
};

const checkEmpty = (value: any) => {
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return Number.isNaN(value);
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

// ---------- validators ----------

const validateLength = ({
                          value,
                          rules
                        }: {
  value: string | string[] | number[];
  rules: RuleMap["length"];
}): { error: string | null; success: boolean } => {
  if (rules.min) {
    const ok = validateMinLength({ value, length: rules.min.value });
    return ok ? { error: null, success: true } : { error: rules.min.message, success: false };
  }

  if (rules.max) {
    const ok = validateMaxLength({ value, length: rules.max.value });
    return ok ? { error: null, success: true } : { error: rules.max.message, success: false };
  }

  return { error: null, success: false };
};

export const validateFileList = (value: FileList, rules: RuleMap["fileList"]) => {
  const r = rules.rules;

  if (r?.maxCount && value.length > r.maxCount.value) {
    return { success: false, error: r.maxCount.message };
  }

  for (const file of Array.from(value)) {
    if (r?.extensions) {
      const ok = validateFileType({ value: file, allowedMimeTypes: r.extensions.value });
      if (!ok) return { success: false, error: r.extensions.message };
    }

    if (r?.maxSize) {
      const ok = validateFileSize({ value: file, maxSize: r.maxSize.value });
      if (!ok) return { success: false, error: r.maxSize.message };
    }
  }

  return { success: true, error: null };
};

export const validateFile = (value: File, rules: RuleMap["file"]) => {
  const r = rules.rules;

  if (r?.extensions) {
    const ok = validateFileType({ value, allowedMimeTypes: r.extensions.value });
    if (!ok) return { success: false, error: r.extensions.message };
  }

  if (r?.maxSize) {
    const ok = validateFileSize({ value, maxSize: r.maxSize.value });
    if (!ok) return { success: false, error: r.maxSize.message };
  }

  return { success: true, error: null };
};

export const validateNumber = (value: string | number, rules: RuleMap["number"]) => {
  // keep your trailing "." guard
  if (typeof value === "string") {
    const str = value.trim();
    if (str.endsWith(".")) {
      return { error: rules.message };
    }
  }

  let schema = z.coerce.number({
    error: () => rules.message
  });

  if (rules.rules?.positive) {
    schema = schema.positive({ error: rules.rules.positive.message });
  }

  if (rules.rules?.min) {
    schema = schema.gte(rules.rules.min.value, { error: rules.rules.min.message });
  }

  if (rules.rules?.max) {
    schema = schema.lte(rules.rules.max.value, { error: rules.rules.max.message });
  }

  if (rules.rules?.integer) {
    schema = schema.int({ error: rules.rules.integer.message });
  }

  const finalSchema = schema.refine((num) => Number.isFinite(num), { error: rules.message });

  const result = finalSchema.safeParse(value);

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? rules.message };
  }

  return { error: null };
};

const validateEmail = (value: string, rules: RuleMap["email"]) => {
  // Zod v4 format helper
  const result = z.email({ error: rules.message }).safeParse(value); // :contentReference[oaicite:3]{index=3}

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? rules.message };
  }
  return { error: null };
};

const validateForAlphanumeric = (value: string, rules: RuleMap["alphanumeric"]) => {
  const regExp = /^[a-zA-Z0-9]*$/;
  if (!regExp.test(value)) return { error: rules.message };
  return { error: null };
};

// ---------- main API ----------

export const validateField = (value: any, rules?: FieldRules) => {
  if (!rules) return { success: true as const };

  if (rules.required && !validateRequired(value)) {
    return { success: false as const, error: rules.required.message };
  }

  // if it's empty AND not required, skip other checks
  if (checkEmpty(value)) return { success: true as const };

  if (rules.number) {
    const { error } = validateNumber(value, rules.number);
    if (error) return { success: false as const, error };
  }

  if (rules.file) {
    const { error } = validateFile(value, rules.file);
    if (error) return { success: false as const, error };
  }

  if (rules.fileList) {
    const { error } = validateFileList(value, rules.fileList);
    if (error) return { success: false as const, error };
  }

  if (rules.email) {
    const { error } = validateEmail(value, rules.email);
    if (error) return { success: false as const, error };
  }

  if (rules.alphanumeric) {
    const { error } = validateForAlphanumeric(value, rules.alphanumeric);
    if (error) return { success: false as const, error };
  }

  if (rules.length) {
    const { error } = validateLength({ value, rules: rules.length });
    if (error) return { success: false as const, error };
  }

  if (rules.hasLetter) {
    const ok = validateHasLetter({ value });
    if (!ok) return { success: false as const, error: rules.hasLetter.message };
  }

  if (rules.hasSpecialCharacter) {
    const ok = validateHasSpecialCharacter({ value });
    if (!ok) return { success: false as const, error: rules.hasSpecialCharacter.message };
  }

  if (rules.matchWith) {
    const ok = validateMatchWith({ value, matchWith: rules.matchWith.value });
    if (!ok) return { success: false as const, error: rules.matchWith.message };
  }

  return { success: true as const };
};

export const validateForm = <T extends Record<string, any>>(
  formData: T,
  schema: ValidationSchema
): ValidationResult<T> => {
  const errorMessages: Partial<Record<keyof T, string>> = {};

  for (const [key, value] of Object.entries(formData)) {
    const rule = schema[key];
    if (!rule) continue;

    const { error } = validateField(value, rule);
    if (error) {
      errorMessages[key as keyof T] = error;
    }
  }

  return Object.keys(errorMessages).length
    ? { success: false, error: errorMessages }
    : { success: true, error: null };
};