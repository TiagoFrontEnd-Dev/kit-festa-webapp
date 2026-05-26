"use client";

export type ClientNoticeType = "success" | "error" | "info";

type Props = {
  title: string;
  message: string;
  type?: ClientNoticeType;
  onClose: () => void;
};

const styles = {
  success: {
    border: "border-rose-200 dark:border-rose-800",
    title: "text-rose-600 dark:text-rose-200",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-200",
  },
  error: {
    border: "border-red-200 dark:border-red-800",
    title: "text-red-600 dark:text-red-200",
    icon: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-200",
  },
  info: {
    border: "border-pink-200 dark:border-pink-800",
    title: "text-pink-600 dark:text-pink-200",
    icon: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-200",
  },
};

export default function ClientNotice({
  title,
  message,
  type = "info",
  onClose,
}: Props) {
  const visual = styles[type];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        className={`w-full max-w-md rounded-3xl border ${visual.border} bg-white p-6 text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-white`}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-black ${visual.icon}`}
          >
            {type === "error" ? "!" : "♡"}
          </div>

          <div>
            <h2 className={`text-2xl font-black ${visual.title}`}>
              {title}
            </h2>

            <p className="mt-2 leading-7 text-gray-700 dark:text-gray-200">
              {message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-600"
        >
          Tudo bem
        </button>
      </div>
    </div>
  );
}
