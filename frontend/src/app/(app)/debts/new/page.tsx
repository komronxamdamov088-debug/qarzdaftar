import { getServerToken } from "@/lib/session";
import { SignInRequired } from "@/components/sign-in-required";
import { AddDebtWizard } from "./add-debt-wizard";

export default async function NewDebtPage() {
  const token = await getServerToken();
  if (!token) {
    return <SignInRequired />;
  }

  return <AddDebtWizard />;
}
