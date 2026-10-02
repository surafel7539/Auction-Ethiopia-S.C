import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="px-4 py-10 sm:py-16">
      <AuthForm mode="login" next={params.next || "/dashboard"} />
    </div>
  );
}
