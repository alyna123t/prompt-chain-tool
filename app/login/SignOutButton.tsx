export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--border)]"
      >
        Sign out
      </button>
    </form>
  );
}
