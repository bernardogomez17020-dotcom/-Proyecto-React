import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import GenericTable from './GenericTable';
import Breadcrumb from './Breadcrumb';

interface Action {
  name: string;
  label: string;
}

interface Column {
  key: string;
  label: string;
}

interface GenericListPageProps {
  title: string;
  columns: Column[];
  fetchData: () => Promise<any[]>;
  onDelete?: (id: string, item?: any) => Promise<boolean>;
  createPath?: string;
  editPath?: string;
  extraActions?: Action[];
  onExtraAction?: (name: string, item: any) => void;
}

const GenericListPage: React.FC<GenericListPageProps> = ({
  title,
  columns,
  fetchData,
  onDelete,
  createPath,
  editPath,
  extraActions = [],
  onExtraAction,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const result = await fetchData();
    setData(result);
  };

  const actions: Action[] = [
    ...(editPath ? [{ name: 'edit', label: 'Editar' }] : []),
    ...(onDelete ? [{ name: 'delete', label: 'Eliminar' }] : []),
    ...extraActions,
  ];

  const handleAction = (action: string, item: any) => {
    if (action === 'edit' && editPath) {
      navigate(`${editPath}/${item.id}`);
    } else if (action === 'delete' && onDelete) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede revertir',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then(async result => {
        if (result.isConfirmed) {
          const success = await onDelete(item.id, item);
          if (success) {
            Swal.fire('Eliminado', 'El registro fue eliminado.', 'success');
            load();
          } else {
            Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
          }
        }
      });
    } else {
      onExtraAction?.(action, item);
    }
  };

  return (
    <div>
      <Breadcrumb pageName={title} />
      {createPath && (
        <div className="mb-4">
          <button
            onClick={() => navigate(createPath)}
            className="inline-flex items-center justify-center rounded bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90 transition"
          >
            + Crear
          </button>
        </div>
      )}
      <GenericTable data={data} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default GenericListPage;
