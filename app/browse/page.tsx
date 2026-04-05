import { redirect } from "next/navigation";

/** Retailers and examples now live on the home Discover tab. */
export default function BrowseRedirect() {
  redirect("/");
}
