import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate, type ValidationError } from "class-validator";

import { HttpError } from "./http-error";

/** Concrete class constructor — avoids `ClassConstructor` resolution issues in typed lint. */
export type DtoClass<T extends object> = new (...args: never[]) => T;

function collectMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const e of errors) {
    if (e.constraints) {
      messages.push(...Object.values(e.constraints));
    }
    if (e.children && e.children.length > 0) {
      messages.push(...collectMessages(e.children));
    }
  }
  return messages;
}

export async function validateBody<T extends object>(
  DtoClass: DtoClass<T>,
  body: unknown,
): Promise<T> {
  const instance = plainToInstance(DtoClass as ClassConstructor<T>, body as object);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const messages = collectMessages(errors);
    const message = messages[0] ?? "Validation failed";
    throw new HttpError(400, message);
  }
  return instance;
}

export async function validateQuery<T extends object>(
  DtoClass: DtoClass<T>,
  queryPayload: unknown,
): Promise<T> {
  const instance = plainToInstance(DtoClass as ClassConstructor<T>, queryPayload as object);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const messages = collectMessages(errors);
    const message = messages[0] ?? "Validation failed";
    throw new HttpError(400, message);
  }
  return instance;
}
