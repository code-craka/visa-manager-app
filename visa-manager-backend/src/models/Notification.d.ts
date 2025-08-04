export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'task' | 'payment' | 'urgent';
    read: boolean;
    created_at: Date;
}
export declare const createNotification: (userId: number, title: string, message: string, type?: "info" | "task" | "payment" | "urgent") => Promise<Notification>;
export declare const getUserNotifications: (userId: number, page?: number, limit?: number, unreadOnly?: boolean) => Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare const markNotificationAsRead: (notificationId: number, userId: number) => Promise<Notification>;
export declare const markAllNotificationsAsRead: (userId: number) => Promise<number>;
export declare const getUnreadNotificationCount: (userId: number) => Promise<number>;
export declare const deleteNotification: (notificationId: number, userId: number) => Promise<boolean>;
export declare const createTaskNotification: (assigneeId: number, taskId: number, taskType: string, clientName: string, action: "assigned" | "updated" | "completed") => Promise<Notification>;
export declare const createPaymentNotification: (userId: number, amount: number, status: "paid" | "pending" | "overdue") => Promise<Notification>;
export declare const bulkCreateNotifications: (userIds: number[], title: string, message: string, type?: "info" | "task" | "payment" | "urgent") => Promise<Notification[]>;
export declare const cleanupOldNotifications: () => Promise<number>;
//# sourceMappingURL=Notification.d.ts.map