import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import GenericTable from '../../components/GenericTable';
import { userService } from '../../services/userService';
import { careerService } from '../../services/careerService';
import { registrationService } from '../../services/registrationService';
import { studentService } from '../../services/studentService';
import { Career } from '../../models/Career';

const columns = [
  { key: 'email', label: 'Correo' },
  { key: 'role', label: 'Rol' },
  { key: 'is_active', label: 'Activo' },
];

const tableActions = [
  { name: 'edit', label: 'Editar' },
  { name: 'deactivate', label: 'Desactivar' },
];

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [careerFilter, setCareerFilter] = useState('');

  useEffect(() => {
    careerService.getAll().then(setCareers);
    load('', '', '');
  }, []);

  const load = async (role: string, active: string, careerId: string) => {
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (active !== '') params.is_active = active;

    let users = Object.keys(params).length > 0
      ? await userService.search(params)
      : await userService.getAll();

    if (careerId) {
      const registrations = await registrationService.getAll();
      const careerRegistrations = registrations.filter(r => r.career_id === careerId);
      const studentIds = careerRegistrations.map(r => r.student_id).filter(Boolean);
      const allStudents = await studentService.getAll();
      const userIds = allStudents
        .filter(s => studentIds.includes(s.id))
        .map(s => s.user_id)
        .filter(Boolean);
      users = users.filter(u => userIds.includes(u.id));
    }

    setData(users);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load(roleFilter, activeFilter, careerFilter);
  };

  const handleAction = async (action: string, item: any) => {
    if (action === 'edit') {
      navigate(`/users/update/${item.id}`);
    } else if (action === 'deactivate') {
      const result = await Swal.fire({
        title: '¿Desactivar usuario?',
        text: 'El usuario no podrá iniciar sesión hasta que sea reactivado.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Desactivar',
        cancelButtonText: 'Cancelar',
      });
      if (!result.isConfirmed) return;
      const success = await userService.deactivate(item.id);
      Swal.fire(
        success
          ? { title: 'Usuario desactivado', icon: 'success', timer: 1500, showConfirmButton: false }
          : { title: 'Error', text: 'No se pudo desactivar el usuario.', icon: 'error' }
      );
      if (success) load(roleFilter, activeFilter, careerFilter);
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Usuarios" />

      <form onSubmit={handleFilter} className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Rol</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos</option>
            <option value="ADMIN">Administrador</option>
            <option value="TEACHER">Docente</option>
            <option value="STUDENT">Estudiante</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Estado</label>
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value)}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-black dark:text-white">Carrera</label>
          <select
            value={careerFilter}
            onChange={e => setCareerFilter(e.target.value)}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todas</option>
            {careers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          Buscar
        </button>

        <button
          type="button"
          onClick={() => navigate('/users/create')}
          className="ml-auto rounded bg-primary px-4 py-2 text-sm text-white transition hover:bg-opacity-90"
        >
          + Crear
        </button>
      </form>

      <GenericTable data={data} columns={columns} actions={tableActions} onAction={handleAction} />
    </div>
  );
};

export default UserList;
