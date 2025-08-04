export interface User {
    id: number;
    neon_user_id: string;
    email: string;
    name: string;
    role: 'agency' | 'partner';
    created_at: Date;
    updated_at: Date;
}
export declare const createOrUpdateUser: (neonUserId: string, email: string, name: string, role?: "agency" | "partner") => Promise<User>;
export declare const getUserByNeonId: (neonUserId: string) => Promise<User | null>;
export declare const getDatabaseUserIdByNeonId: (neonUserId: string) => Promise<number | null>;
export declare const getUserById: (id: number) => Promise<User | null>;
export declare const getUserByEmail: (email: string) => Promise<User | null>;
export declare const updateUserRole: (userId: number, newRole: "agency" | "partner") => Promise<User>;
export declare const getAllUsers: () => Promise<User[]>;
export declare const getUsersByRole: (role: "agency" | "partner") => Promise<User[]>;
export declare const deleteUser: (userId: number) => Promise<boolean>;
export declare const getUserStats: () => Promise<any>;
//# sourceMappingURL=User.d.ts.map