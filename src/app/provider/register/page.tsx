import { redirect } from "next/navigation";

// /provider/register now redirects to the new unified registration flow
export default function ProviderRegisterRedirect() {
  redirect("/register/provider");
}
