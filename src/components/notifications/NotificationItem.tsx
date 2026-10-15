"use client";

import { cn } from "@/lib/utils";
import { AppNotification } from "@/types/types";
import {
	formatNotificationDatetime,
	formatRelativeTime,
	getNotificationIcon,
} from "./notificationUtils";

type NotificationItemProps = {
	notification: AppNotification;
	onClick: (n: AppNotification) => void;
	compact?: boolean;
};

export default function NotificationItem({
	notification: n,
	onClick,
	compact = false,
}: NotificationItemProps) {
	const Icon = getNotificationIcon(n.type);
	const unread = n.readAt === null;

	return (
		<button
			type="button"
			onClick={() => onClick(n)}
			className={cn(
				"w-full flex gap-3 text-left cursor-pointer transition-colors duration-150 hover:bg-gray-100",
				compact ? "px-4 py-3" : "p-4",
				unread && "bg-primary/5"
			)}
		>
			<div
				className={cn(
					"shrink-0 size-9 rounded-full flex items-center justify-center",
					unread ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500"
				)}
			>
				<Icon size={18} />
			</div>
			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-start justify-between gap-2">
					<p
						className={cn(
							"text-sm",
							unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
						)}
					>
						{n.title}
					</p>
					{unread && (
						<span
							className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
							aria-label="Não lida"
						/>
					)}
				</div>
				<p className={cn("text-sm text-gray-600", compact && "line-clamp-2")}>
					{n.message}
				</p>
				<time
					dateTime={n.createdAt}
					title={formatNotificationDatetime(n.createdAt)}
					className="text-xs text-gray-400"
				>
					{formatRelativeTime(n.createdAt)}
				</time>
			</div>
		</button>
	);
}
