import { toggleWatchAction } from "@/app/actions/watch";

export function WatchButton({ listingId, watching }) {
  return (
    <form action={toggleWatchAction.bind(null, listingId)}>
      <button
        type="submit"
        className="w-full rounded-full border border-forest/20 bg-field px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-on sm:w-auto"
      >
        {watching ? "Watching" : "Watch lot"}
      </button>
    </form>
  );
}
