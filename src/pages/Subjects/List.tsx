import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { subjectService } from '../../services/subjectService';
import { groupService } from '../../services/groupService';
import { semesterService } from '../../services/semesterService';
import { studyPlanService } from '../../services/studyPlanService';

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Código' },
  { key: 'credits', label: 'Créditos' },
  { key: 'is_active', label: 'Activo' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'archive', label: 'Archivar' },
  { name: 'delete', label: 'Eliminar' },
];

const SubjectList: React.FC = () => {
  const navigate = useNavigate();
  const [all, setAll] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [creditsFilter, setCreditsFilter] = useState('');

  const load = async () => {
    const data = await subjectService.getAll();
    setAll(data);
    applyFilters(data, statusFilter, creditsFilter);
  };

  const applyFilters = (data: any[], status: string, credits: string) => {
    let result = data;
    if (status === 'active') result = result.filter(s => s.is_active);
    if (status === 'archived') result = result.filter(s => !s.is_active);
    if (credits !== '') result = result.filter(s => s.credits === Number(credits));
    setFiltered(result);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(all, value, creditsFilter);
  };

  const handleCreditsChange = (value: string) => {
    setCreditsFilter(value);
    applyFilters(all, statusFilter, value);
  };

  // E3: verificar que la asignatura no tenga grupos en semestre activo ni planes publicados
  const checkCanArchive = async (subjectId: string): Promise<string | null> => {
    const [groups, semesters, plans] = await Promise.all([
      groupService.getAll(),
      semesterService.getAll(),
      studyPlanService.getAll(),
    ]);

    const activeSemester = semesters.find(s => s.is_active);
    if (activeSemester) {
      const activeGroups = groups.filter(
        g => g.subject_id === subjectId && g.semester_id === activeSemester.id
      );
      if (activeGroups.length > 0) {
        return `La asignatura tiene ${activeGroups.length} grupo(s) en el semestre activo. Elimina los grupos antes de archivar.`;
      }
    }

    const publishedWithSubject: string[] = [];
    for (const plan of plans.filter(p => p.is_published)) {
      const subjects = await studyPlanService.getSubjects(plan.id!);
      if (subjects.some(s => s.id === subjectId)) {
        publishedWithSubject.push(plan.name ?? plan.id!);
      }
    }
    if (publishedWithSubject.length > 0) {
      return `La asignatura está vinculada a ${publishedWithSubject.length} plan(es) publicado(s): ${publishedWithSubject.join(', ')}.`;
    }

    return null;
  };

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/subjects/form/${item.id}`);
    } else if (action === 'archive') {
      if (!item.is_active) {
        Swal.fire({ title: 'Ya archivada', text: 'Esta asignatura ya está inactiva.', icon: 'info', timer: 1500, showConfirmButton: false });
        return;
      }

      const blockReason = await checkCanArchive(item.id);
      if (blockReason) {
        Swal.fire({ title: 'No se puede archivar', text: blockReason, icon: 'error' });
        return;
      }

      const { isConfirmed } = await Swal.fire({
        title: '¿Archivar asignatura?',
        text: 'La asignatura quedará inactiva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Archivar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;

      const ok = await subjectService.archive(item.id);
      Swal.fire(
        ok
          ? { title: 'Archivada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo archivar la asignatura.', icon: 'error' }
      );
      if (ok) load();
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar asignatura?',
        text: 'Esta acción no se puede revertir.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await subjectService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'No se puede eliminar', text: 'Esta asignatura tiene grupos o planes asociados.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Asignaturas" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Estado</label>
          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos</option>
            <option value="active">Activas</option>
            <option value="archived">Archivadas</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Créditos</label>
          <input
            type="number"
            min="1"
            value={creditsFilter}
            onChange={e => handleCreditsChange(e.target.value)}
            placeholder="Ej: 3"
            className="w-24 rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          />
        </div>

        <button
          onClick={() => navigate('/subjects/form')}
          className="ml-auto rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>

      <GenericTable data={filtered} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default SubjectList;
