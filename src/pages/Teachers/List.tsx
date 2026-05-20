import React from 'react';
import GenericListPage from '../../components/GenericListPage';
import { teacherService } from '../../services/teacherService';

const TeacherList: React.FC = () => (
  <GenericListPage
    title="Docentes"
    columns={[
      { key: 'first_name', label: 'Nombre' },
      { key: 'last_name', label: 'Apellido' },
      { key: 'identification', label: 'Identificación' },
      { key: 'specialty', label: 'Especialidad' },
      { key: 'phone', label: 'Teléfono' },
    ]}
    fetchData={() => teacherService.getAll()}
    onDelete={(id) => teacherService.delete(id)}
    createPath="/teachers/form"
    editPath="/teachers/form"
  />
);

export default TeacherList;
