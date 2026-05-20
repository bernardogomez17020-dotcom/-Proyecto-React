import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { semesterService } from '../../services/semesterService';

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Código' },
  { key: 'start_date', label: 'Fecha inicio' },
  { key: 'end_date', label: 'Fecha fin' },
  { key: 'is_active', label: 'Activo' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'activate', label: 'Activar' },
  { name: 'delete', label: 'Eliminar' },
];

const SemesterList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);

  const load = () => semesterService.getAll().then(setData);

  useEffect(() => { load(); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/semesters/form/${item.id}`);
    } else if (action === 'activate') {
      if (item.is_active) {
        Swal.fire({ title: 'Ya activo', text: 'Este semestre ya está activo.', icon: 'info', timer: 1500, showConfirmButton: false });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Activar semestre?',
        text: `Se activará "${item.name}" y se desactivará el semestre anterior.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Activar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await semesterService.activate(item.id);
      Swal.fire(
        ok
          ? { title: 'Semestre activado', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo activar el semestre.', icon: 'error' }
      );
      if (ok) load();
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar semestre?',
        text: 'Esta acción no se puede revertir.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await semesterService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'No se puede eliminar', text: 'Este semestre tiene grupos asociados. Elimina primero los grupos.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Semestres" />
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/semesters/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>
      <GenericTable data={data} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default SemesterList;
