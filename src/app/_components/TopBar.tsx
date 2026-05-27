import Link from "next/link";
import { signOut } from "@/lib/auth";
import { ThumbsUpIcon } from "./ThumbsUpIcon";
import { NavLink } from "./NavLink";

export function TopBar({
  user,
}: {
  user: { name?: string | null; image?: string | null };
}) {
  return (
    <div className="flex w-full max-w-4xl items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2 text-lg sm:text-2xl font-bold shrink-0">
        <span className="inline-block animate-spin-3d mb-1">
          <ThumbsUpIcon size={22} />
        </span>
        I Like This Album.
      </Link>

      <div className="flex items-center gap-3 sm:gap-10">
        <NavLink />

        <div className="flex flex-col items-center mt-[5px] sm:items-end sm:mt-5 text-sm">
          <div className="flex items-center gap-2">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
            )}
            <span className="hidden sm:inline">{user.name}</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-xs text-gray-500 hover:underline active:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
