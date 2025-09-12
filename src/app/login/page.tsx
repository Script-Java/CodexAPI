import { signIn } from "@/auth";
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";

export default function LoginPage() {
  const csrfToken = generateCsrfToken();
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Login</h1>
      <form
        action={async (formData) => {
          "use server";
          validateCsrfToken(formData.get("csrf") as string);
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          await signIn("credentials", { email, password, redirectTo: "/app" });
        }}
        className="flex flex-col gap-2 max-w-sm"
      >
        <input type="hidden" name="csrf" value={csrfToken} />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <form
        action={async (formData) => {
          "use server";
          validateCsrfToken(formData.get("csrf") as string);
          await signIn("google", { redirectTo: "/app" });
        }}
      >
        <input type="hidden" name="csrf" value={csrfToken} />
        <button type="submit" className="mt-4">Login with Google</button>
      </form>
    </div>
  );
}
