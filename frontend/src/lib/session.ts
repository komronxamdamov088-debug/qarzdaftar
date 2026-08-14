import { cookies } from "next/headers";

export const SESSION_COOKIE = "qd_session";

export async function getServerToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}
