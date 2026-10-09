import { data } from "@/lib/data";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const user = await data.getSessionUser();
  return <SiteNav user={user} />;
}
