import React, { useState } from "react";
import GenericTable from "../../components/GenericTable";

interface Role {
    id: number;
    name: string;
}

const Roles: React.FC = () => {
    const [roles] = useState<Role[]>([
        { id: 1, name: "Admin" },
        { id: 2, name: "User" },
    ]);

    const handleAction = (action: string, item: Record<string, any>) => {
        if (action === "assignPermissions") {
            console.log("Assign permissions to role:", item);
        }
    };

    return (
        <div>
            <h2>Role List</h2>
            <GenericTable
                data={roles}
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Nombre' },
                ]}
                actions={[{ name: "assignPermissions", label: "Asignar Permisos" }]}
                onAction={handleAction}
            />
        </div>
    );
};

export default Roles;
