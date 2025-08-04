export interface Task {
    id: number;
    client_id: number;
    assigned_to: number | null;
    created_by: number;
    task_type: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    commission: number;
    payment_status: 'unpaid' | 'paid' | 'partial';
    due_date: Date | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
export declare const createTask: (clientId: number, assignedTo: number | null, createdBy: number, taskType: string, description: string | null, commission: number, dueDate?: Date | null) => Promise<Task>;
export declare const getAllTasks: (page?: number, limit?: number, filters?: {
    assignedTo?: number;
    createdBy?: number;
    status?: string;
    clientId?: number;
}) => Promise<{
    tasks: Task[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare const getTaskById: (id: number) => Promise<Task | null>;
export declare const updateTaskStatus: (id: number, status: "pending" | "in_progress" | "completed" | "cancelled", userId: number) => Promise<Task>;
export declare const assignTask: (id: number, assignedTo: number | null, assignedBy: number) => Promise<Task>;
export declare const updatePaymentStatus: (id: number, paymentStatus: "unpaid" | "paid" | "partial", updatedBy: number) => Promise<Task>;
export declare const getCommissionSummary: (userId: number, role: "agency" | "partner") => Promise<any>;
export declare const deleteTask: (id: number, userId: number) => Promise<boolean>;
export declare const getOverdueTasks: () => Promise<Task[]>;
//# sourceMappingURL=Task.d.ts.map