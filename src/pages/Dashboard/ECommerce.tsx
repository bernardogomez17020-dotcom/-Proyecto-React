import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const adminCards = [
  { label: 'Usuarios', path: '/users/list', desc: 'Gestionar cuentas de usuarios del sistema' },
  { label: 'Carreras', path: '/careers/list', desc: 'Administrar carreras académicas' },
  { label: 'Semestres', path: '/semesters/list', desc: 'Gestionar períodos académicos' },
  { label: 'Asignaturas', path: '/subjects/list', desc: 'Administrar asignaturas' },
  { label: 'Grupos', path: '/groups/list', desc: 'Gestionar grupos de clase' },
  { label: 'Matrículas', path: '/registrations/list', desc: 'Administrar matrículas de estudiantes' },
  { label: 'Inscripciones', path: '/enrollments/list', desc: 'Gestionar inscripciones en grupos' },
];

const teacherCards = [
  { label: 'Rúbricas', path: '/rubrics/list', desc: 'Crear y gestionar rúbricas de evaluación' },
  { label: 'Evaluaciones', path: '/evaluations/list', desc: 'Gestionar evaluaciones de grupos' },
];

const studentCards = [
  { label: 'Mis Evaluaciones', path: '/student/my-evaluations', desc: 'Ver evaluaciones y notas' },
];

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const role = user?.role;

  const cards = role === 'ADMIN' ? adminCards : role === 'TEACHER' ? teacherCards : studentCards;
  const roleName = role === 'ADMIN' ? 'Administrador' : role === 'TEACHER' ? 'Docente' : 'Estudiante';

  return (
    <div>
      <div className="mb-6 rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Sistema de Evaluación por Rúbricas
        </h2>
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          Bienvenido, {roleName}. Selecciona una opción para comenzar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(card => (
          <Link
            key={card.path}
            to={card.path}
            className="block rounded-sm border border-stroke bg-white p-6 shadow-default hover:border-primary dark:border-strokedark dark:bg-boxdark dark:hover:border-primary transition-colors"
          >
            <h3 className="mb-1 text-base font-semibold text-black dark:text-white">{card.label}</h3>
            <p className="text-sm text-body dark:text-bodydark">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
