import { AuthScreen } from "@/components/AuthScreen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="px-4 py-10 sm:py-16">
      <AuthScreen mode="login" />
    </div>
  );
}
