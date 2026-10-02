import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Register",
};

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="px-4 py-10 sm:py-16">
      <AuthForm mode="register" next={params.next || "/dashboard"} />
    </div>
  );
}
