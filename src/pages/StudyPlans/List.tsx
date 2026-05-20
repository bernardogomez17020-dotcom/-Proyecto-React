import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { studyPlanService } from '../../services/studyPlanService';
import { careerService } from '../../services/careerService';
import { Career } from '../../models/Career';

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'delete', label: 'Eliminar' },
];

const StudyPlanList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [careerFilter, setCareerFilter] = useState('');

  const load = async (careerId: string) => {
    const [plans, allCareers] = await Promise.all([
      studyPlanService.getAll(),
      careerService.getAll(),
    ]);
    setCareers(allCareers);
    const careerMap = Object.fromEntries(allCareers.map(c => [c.id, c.name]));
    const enriched = plans
      .filter(p => !careerId || p.career_id === careerId)
      .map(p => ({ ...p, career_name: careerMap[p.career_id ?? ''] ?? '—' }));
    setRows(enriched);
  };

  useEffect(() => { load(''); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/study-plans/form/${item.id}`);
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar plan de estudio?',
        text: 'Se eliminarán también las asignaturas vinculadas al plan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await studyPlanService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo eliminar el plan.', icon: 'error' }
      );
      if (ok) load(careerFilter);
    }
  };

  const columns = [
    { key: 'career_name', label: 'Carrera' },
    { key: 'name', label: 'Nombre' },
    { key: 'year', label: 'Año' },
    { key: 'suggested_semester', label: 'Semestre sugerido' },
    { key: 'is_published', label: 'Publicado' },
  ];

  return (
    <div>
      <Breadcrumb pageName="Planes de Estudio" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Filtrar por carrera</label>
          <select
            value={careerFilter}
            onChange={e => { setCareerFilter(e.target.value); load(e.target.value); }}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todas las carreras</option>
            {careers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => navigate('/study-plans/form')}
          className="ml-auto rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>

      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default StudyPlanList;
