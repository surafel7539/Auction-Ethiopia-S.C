import { AuthScreen } from "@/components/AuthScreen";

export const dynamic = "force-static";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="px-4 py-10 sm:py-16">
      <AuthScreen mode="register" />
    </div>
  );
}
