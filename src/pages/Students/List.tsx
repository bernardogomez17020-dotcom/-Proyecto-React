import React from 'react';
import GenericListPage from '../../components/GenericListPage';
import { studentService } from '../../services/studentService';

const StudentList: React.FC = () => (
  <GenericListPage
    title="Estudiantes"
    columns={[
      { key: 'first_name', label: 'Nombre' },
      { key: 'last_name', label: 'Apellido' },
      { key: 'identification', label: 'Identificación' },
    ]}
    fetchData={() => studentService.getAll()}
    onDelete={(id) => studentService.delete(id)}
    createPath="/students/form"
    editPath="/students/form"
  />
);

export default StudentList;
