import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { careerService } from '../../services/careerService';

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Código' },
  { key: 'description', label: 'Descripción' },
  { key: 'is_active', label: 'Activo' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'archive', label: 'Archivar' },
];

const CareerList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);

  const load = () => careerService.getAll().then(setData);

  useEffect(() => { load(); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/careers/form/${item.id}`);
    } else if (action === 'archive') {
      if (!item.is_active) {
        Swal.fire({ title: 'Ya archivada', text: 'Esta carrera ya está inactiva.', icon: 'info', timer: 1500, showConfirmButton: false });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Archivar carrera?',
        text: 'La carrera quedará inactiva y no podrá asignarse a nuevos planes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Archivar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await careerService.archive(item.id);
      Swal.fire(
        ok
          ? { title: 'Archivada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo archivar la carrera.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Carreras" />
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/careers/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>
      <GenericTable data={data} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default CareerList;
