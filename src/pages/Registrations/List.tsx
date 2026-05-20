import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { registrationService } from '../../services/registrationService';
import { studentService } from '../../services/studentService';
import { careerService } from '../../services/careerService';

const columns = [
  { key: 'student_name', label: 'Estudiante' },
  { key: 'career_name', label: 'Carrera' },
  { key: 'admission_period', label: 'Período de ingreso' },
  { key: 'academic_status', label: 'Estado académico' },
  { key: 'is_active', label: 'Activo' },
];

const actions = [
  { name: 'edit', label: 'Editar' },
  { name: 'delete', label: 'Eliminar' },
];

const RegistrationList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const [registrations, students, careers] = await Promise.all([
      registrationService.getAll(),
      studentService.getAll(),
      careerService.getAll(),
    ]);

    const studentMap = Object.fromEntries(
      students.map(s => [s.id, `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()])
    );
    const careerMap = Object.fromEntries(careers.map(c => [c.id, c.name ?? '—']));

    setRows(registrations.map(r => ({
      ...r,
      student_name: studentMap[r.student_id ?? ''] ?? '—',
      career_name: careerMap[r.career_id ?? ''] ?? '—',
    })));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/registrations/form/${item.id}`);
    } else if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar matrícula?',
        text: 'Esta acción no se puede revertir.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
      const ok = await registrationService.delete(item.id);
      Swal.fire(
        ok
          ? { title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo eliminar la matrícula.', icon: 'error' }
      );
      if (ok) load();
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Matrículas" />
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/registrations/form')}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </div>
      <GenericTable data={rows} columns={columns} actions={actions} onAction={handleAction} />
    </div>
  );
};

export default RegistrationList;
