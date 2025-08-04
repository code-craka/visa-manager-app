export interface Client {
    id: number;
    name: string;
    passport: string;
    visa_type: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export declare const createClient: (name: string, passport: string, visaType: string, createdBy: number) => Promise<Client>;
export declare const getAllClients: (page?: number, limit?: number, createdBy?: number) => Promise<{
    clients: Client[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare const getClientById: (id: number) => Promise<Client | null>;
export declare const updateClient: (id: number, name: string, passport: string, visaType: string) => Promise<Client>;
export declare const deleteClient: (id: number) => Promise<boolean>;
export declare const searchClients: (searchTerm: string, createdBy?: number) => Promise<Client[]>;
export declare const getClientsWithTaskStats: (createdBy?: number) => Promise<any[]>;
//# sourceMappingURL=Client.d.ts.map