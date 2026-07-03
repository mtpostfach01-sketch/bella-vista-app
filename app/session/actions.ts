"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function sessionSetzen(formData: FormData) {
  const mitarbeiter_id = formData.get("mitarbeiter_id") as string;
  if (!mitarbeiter_id) {
    redirect("/?error=kein_mitarbeiter");
  }

  const mitarbeiter = await db.mitarbeiter.findUnique({
    where: { id: Number(mitarbeiter_id) },
  });

  if (!mitarbeiter) {
    redirect("/?error=mitarbeiter_nicht_gefunden");
  }

  const cookieStore = await cookies();
  cookieStore.set("mitarbeiter_id", String(mitarbeiter.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("mitarbeiter_rolle", mitarbeiter.rolle, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}

export async function sessionBeenden() {
  const cookieStore = await cookies();
  cookieStore.delete("mitarbeiter_id");
  cookieStore.delete("mitarbeiter_rolle");
  redirect("/");
}
