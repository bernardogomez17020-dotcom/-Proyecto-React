import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';
import { groupService } from '../../services/groupService';

const statusLabel: Record<string, string> = {
  ACTIVE: 'Activo',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

const statusClass: Record<string, string> = {
  ACTIVE: 'bg-success bg-opacity-10 text-success',
  CANCELLED: 'bg-danger bg-opacity-10 text-danger',
  COMPLETED: 'bg-primary bg-opacity-10 text-primary',
};

const EnrollmentList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const [enrollments, students, groups] = await Promise.all([
      enrollmentService.getAll(),
      studentService.getAll(),
      groupService.getAll(),
    ]);

    const studentMap = Object.fromEntries(
      students.map(s => [s.id, `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()])
    );
    const groupMap = Object.fromEntries(
      groups.map(g => [g.id, `${g.name} (${g.group_code})`])
    );

    setRows(
      enrollments.map(e => ({
        ...e,
        student_name: studentMap[e.student_id ?? ''] ?? '—',
        group_name: groupMap[e.group_id ?? ''] ?? '—',
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (item: any) => {
    if (item.status === 'CANCELLED') {
      Swal.fire({ title: 'Ya cancelada', text: 'Esta inscripción ya está cancelada.', icon: 'info', timer: 1500, showConfirmButton: false });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Cancelar inscripción?',
      text: 'La inscripción quedará cancelada pero el registro se conservará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
    });
    if (!isConfirmed) return;
    const ok = await enrollmentService.update(item.id, { status: 'CANCELLED' });
    Swal.fire(
      ok
        ? { title: 'Cancelada', icon: 'success', timer: 1500, showConfirmButton: false }
        : { title: 'Error', text: 'No se pudo cancelar la inscripción.', icon: 'error' }
    );
    if (ok) load();
  };

  const handleDelete = async (item: any) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar inscripción?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    const ok = await enrollmentService.delete(item.id);
    Swal.fire(
      ok
        ? { title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false }
        : { title: 'Error', text: 'No se pudo eliminar la inscripción.', icon: 'error' }
    );
    if (ok) load();
  };

  return (
    <div>
      <Breadcrumb pageName="Inscripciones" />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/enrollments/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[200px] py-4 px-4 pl-9 xl:pl-11 font-medium text-black dark:text-white">Estudiante</th>
                <th className="min-w-[180px] py-4 px-4 font-medium text-black dark:text-white">Grupo</th>
                <th className="min-w-[140px] py-4 px-4 font-medium text-black dark:text-white">Fecha de inscripción</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Estado</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={i}>
                  <td className="border-b border-[#eee] py-5 px-4 pl-9 xl:pl-11 dark:border-strokedark">
                    <p className="text-black dark:text-white">{item.student_name}</p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <p className="text-black dark:text-white">{item.group_name}</p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <p className="text-black dark:text-white">{item.enrollment_date ?? '—'}</p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <span
                      className={`inline-flex rounded-full py-1 px-3 text-xs font-medium ${
                        statusClass[item.status ?? ''] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabel[item.status ?? ''] ?? item.status ?? '—'}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/enrollments/form/${item.id}`)}
                        className="rounded-md border border-stroke px-2 py-1 text-xs font-medium transition hover:bg-gray-2 dark:border-strokedark"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCancel(item)}
                        className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-orange-500 transition hover:bg-orange-50 dark:border-strokedark"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="rounded-md border border-stroke px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-100 dark:border-strokedark"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentList;
