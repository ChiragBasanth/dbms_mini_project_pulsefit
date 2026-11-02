import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function errorResponse(e: unknown) {
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError)
    return Response.json(
      { error: e.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  const code = (e as { code?: string })?.code;
  if (code === "23505" || code === "23P01")
    return Response.json(
      {
        error:
          "That email, slot or reservation conflicts with an existing record.",
      },
      { status: 409 },
    );
  if (code === "23514" || code === "23503" || code === "22P02")
    return Response.json(
      { error: "Request violates a database integrity rule." },
      { status: 400 },
    );
  if (code === "P0002")
    return Response.json({ error: "Record not found." }, { status: 404 });
  console.error(
    "Request failed",
    e instanceof Error ? e.name : "unknown",
    code || "",
  );
  return Response.json(
    { error: "Service unavailable. Please retry later." },
    { status: 503 },
  );
}
