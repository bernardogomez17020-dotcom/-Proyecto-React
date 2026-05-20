import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { rubricService } from '../../services/rubricService';
import { criterionService } from '../../services/criterionService';
import { scaleService } from '../../services/scaleService';

const columns = [
  { key: 'title', label: 'Título' },
  { key: 'description', label: 'Descripción' },
  { key: 'is_public', label: 'Publicada' },
  { key: 'is_archived', label: 'Archivada' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'publish', label: 'Publicar' },
  { name: 'archive', label: 'Archivar' },
  { name: 'delete', label: 'Eliminar' },
];

const RubricList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const data = await rubricService.getAll();
    setRows(data);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/rubrics/form/${item.id}`);

    } else if (action === 'publish') {
      if (item.is_public) {
        Swal.fire({ title: 'Ya publicada', text: 'Esta rúbrica ya está publicada.', icon: 'info', timer: 1500, showConfirmButton: false });
        return;
      }
      if (item.is_archived) {
        Swal.fire({ title: 'No permitido', text: 'No se puede publicar una rúbrica archivada.', icon: 'error' });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Publicar rúbrica?',
        text: 'Una rúbrica publicada no puede eliminarse, solo archivarse.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Publicar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await rubricService.publish(item.id);
      Swal.fire(
        ok
          ? { title: 'Publicada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo publicar. Verifica que tenga criterios con sus escalas y que los pesos sumen 100%.', icon: 'error' }
      );
      if (ok) load();

    } else if (action === 'archive') {
      if (item.is_archived) {
        Swal.fire({ title: 'Ya archivada', icon: 'info', timer: 1500, showConfirmButton: false });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Archivar rúbrica?',
        text: 'La rúbrica quedará archivada y no podrá asociarse a nuevas evaluaciones.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Archivar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await rubricService.archive(item.id);
      Swal.fire(
        ok
          ? { title: 'Archivada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo archivar la rúbrica.', icon: 'error' }
      );
      if (ok) load();

    } else if (action === 'delete') {
      if (item.is_public) {
        Swal.fire({ title: 'No permitido', text: 'Las rúbricas publicadas no pueden eliminarse. Usa "Archivar" en su lugar.', icon: 'warning' });
        return;
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar rúbrica?',
        text: 'Se eliminarán también todos sus criterios y escalas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;

      // Cascade: delete scales → criteria → rubric (backend FK constraint)
      const [allCriteria, allScales] = await Promise.all([
        criterionService.getAll(),
        scaleService.getAll(),
      ]);
      const rubricCriteria = allCriteria.filter(c => c.rubric_id === item.id);
      const criteriaIds = new Set(rubricCriteria.map(c => c.id));
      const rubricScales = allScales.filter(s => criteriaIds.has(s.criterion_id));

      await Promise.all(rubricScales.map(s => scaleService.delete(s.id!)));
      await Promise.all(rubricCriteria.map(c => criterionService.delete(c.id!)));
      const ok = await rubricService.delete(item.id);

      Swal.fire(
        ok
          ? { title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo eliminar la rúbrica.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Rúbricas" />
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/rubrics/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>
      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default RubricList;
