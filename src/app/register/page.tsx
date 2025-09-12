export default function RegisterPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Register</h1>
      <form action="/register" method="post" className="flex flex-col gap-2 max-w-sm">
        <input name="name" type="text" placeholder="Name" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
