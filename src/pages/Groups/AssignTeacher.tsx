import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { groupService } from '../../services/groupService';
import { teacherService } from '../../services/teacherService';
import { subjectService } from '../../services/subjectService';
import { Teacher } from '../../models/Teacher';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const AssignTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [subjectName, setSubjectName] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      groupService.getById(id),
      teacherService.getAll(),
      groupService.getAll(),
    ]).then(([grp, tchs, grps]) => {
      setGroup(grp);
      setTeachers(tchs);
      setAllGroups(grps);
      if (grp?.teacher_id) setSelectedTeacherId(grp.teacher_id);
      if (grp?.subject_id) {
        subjectService.getById(grp.subject_id).then(s => setSubjectName(s?.name ?? ''));
      }
      setLoading(false);
    });
  }, [id]);

  const handleAssign = async () => {
    if (!id || !group) return;

    // E3: grupo sin asignatura
    if (!group.subject_id) {
      Swal.fire({ title: 'Sin asignatura', text: 'El grupo no tiene una asignatura definida. Edítalo primero.', icon: 'error' });
      return;
    }

    if (!selectedTeacherId) {
      Swal.fire({ title: 'Selecciona un docente', icon: 'warning' });
      return;
    }

    // E1: mismo docente ya asignado
    if (group.teacher_id === selectedTeacherId) {
      Swal.fire({ title: 'Sin cambios', text: 'Este docente ya está asignado a este grupo.', icon: 'info' });
      return;
    }

    // E2: docente ya tiene grupo con misma asignatura en mismo semestre
    const conflict = allGroups.find(
      g => g.id !== id &&
           g.teacher_id === selectedTeacherId &&
           g.subject_id === group.subject_id &&
           g.semester_id === group.semester_id
    );
    if (conflict) {
      Swal.fire({
        title: 'Conflicto de asignación',
        text: `El docente ya tiene el grupo "${conflict.name ?? conflict.group_code}" con la misma asignatura en este semestre.`,
        icon: 'error',
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar asignación?',
      html: `Se asignará el docente seleccionado al grupo <b>${group.name ?? group.group_code}</b>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    const ok = await groupService.assignTeacher(id, selectedTeacherId);
    if (ok) {
      Swal.fire({ title: 'Docente asignado', icon: 'success', timer: 1500, showConfirmButton: false });
      navigate('/groups/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo realizar la asignación.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!group) return <div className="p-6">Grupo no encontrado.</div>;

  const currentTeacher = teachers.find(t => t.id === group.teacher_id);

  return (
    <div>
      <Breadcrumb pageName="Asignar Docente al Grupo" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6 p-6">
        <h3 className="text-base font-semibold text-black dark:text-white mb-4">Información del grupo</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-black dark:text-white">Nombre: </span>
            <span className="text-body dark:text-bodydark">{group.name}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Código: </span>
            <span className="text-body dark:text-bodydark">{group.group_code}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Asignatura: </span>
            <span className="text-body dark:text-bodydark">{subjectName || '—'}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Docente actual: </span>
            <span className="text-body dark:text-bodydark">
              {currentTeacher
                ? `${currentTeacher.first_name ?? ''} ${currentTeacher.last_name ?? ''}`.trim()
                : 'Sin asignar'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <h3 className="text-base font-semibold text-black dark:text-white mb-4">Seleccionar docente</h3>
        <div className="mb-6">
          <label className="mb-2.5 block text-black dark:text-white">Docente <span className="text-meta-1">*</span></label>
          <select
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar...</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {`${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()} — {t.identification ?? t.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAssign}
            className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition"
          >
            Asignar
          </button>
          <button
            onClick={() => navigate('/groups/list')}
            className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTeacher;
